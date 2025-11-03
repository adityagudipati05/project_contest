/**
 * ML Model Service
 * Handles loading and inference for UNet and Mask R-CNN models
 */

import * as tf from '@tensorflow/tfjs';

class MLModelService {
  constructor() {
    this.unetModel = null;
    this.maskRCNNModel = null;
    this.modelsLoaded = false;
    this.loadingPromise = null;
  }

  /**
   * Load UNet model for change detection
   */
  async loadUNetModel() {
    try {
      // In production, load actual model from:
      // - Local model files
      // - Remote model server
      // - Model hosting service (TensorFlow Hub, etc.)
      
      // For now, create a placeholder model structure
      // Replace this URL with your actual UNet model path
      const modelUrl = '/models/unet-change-detection/model.json';
      
      try {
        // Try to load actual model
        this.unetModel = await tf.loadLayersModel(modelUrl);
        console.log('✅ UNet model loaded successfully');
      } catch (error) {
        console.warn('UNet model not found, using placeholder:', error.message);
        // Create a simple placeholder model for demonstration
        this.unetModel = this.createPlaceholderUNet();
      }
      
      return this.unetModel;
    } catch (error) {
      console.error('Error loading UNet model:', error);
      throw error;
    }
  }

  /**
   * Load Mask R-CNN model for building detection
   */
  async loadMaskRCNNModel() {
    try {
      // In production, load actual Mask R-CNN model
      const modelUrl = '/models/mask-rcnn-buildings/model.json';
      
      try {
        // Try to load actual model
        this.maskRCNNModel = await tf.loadGraphModel(modelUrl);
        console.log('✅ Mask R-CNN model loaded successfully');
      } catch (error) {
        console.warn('Mask R-CNN model not found, using placeholder:', error.message);
        // Create placeholder for demonstration
        this.maskRCNNModel = this.createPlaceholderMaskRCNN();
      }
      
      return this.maskRCNNModel;
    } catch (error) {
      console.error('Error loading Mask R-CNN model:', error);
      throw error;
    }
  }

  /**
   * Load all models
   */
  async loadModels() {
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.loadingPromise = Promise.all([
      this.loadUNetModel(),
      this.loadMaskRCNNModel()
    ]).then(() => {
      this.modelsLoaded = true;
      console.log('✅ All ML models loaded');
    });

    return this.loadingPromise;
  }

  /**
   * Preprocess image for UNet input
   */
  preprocessImageForUNet(imageElement) {
    // Convert to tensor and normalize
    const tensor = tf.browser.fromPixels(imageElement);
    
    // Resize to model input size (typically 512x512 for UNet)
    const resized = tf.image.resizeBilinear(tensor, [512, 512]);
    
    // Normalize to [0, 1]
    const normalized = resized.div(255.0);
    
    // Add batch dimension: [1, 512, 512, 3]
    const batched = normalized.expandDims(0);
    
    return batched;
  }

  /**
   * Run UNet change detection
   */
  async detectChangesWithUNet(beforeImage, afterImage) {
    if (!this.modelsLoaded) {
      await this.loadModels();
    }

    try {
      // Load images
      const beforeImg = await this.loadImageElement(beforeImage.url || beforeImage);
      const afterImg = await this.loadImageElement(afterImage.url || afterImage);

      // Preprocess images
      const beforeTensor = this.preprocessImageForUNet(beforeImg);
      const afterTensor = this.preprocessImageForUNet(afterImg);

      // Stack images as input: [1, 512, 512, 6] (3 channels from each image)
      const input = tf.concat([beforeTensor, afterTensor], 3);

      // Run inference
      const prediction = this.unetModel.predict(input);

      // Post-process prediction
      const changeMask = await this.postprocessChangeMask(prediction, beforeImg.width, beforeImg.height);

      // Clean up tensors
      beforeTensor.dispose();
      afterTensor.dispose();
      input.dispose();
      prediction.dispose();

      return changeMask;
    } catch (error) {
      console.error('Error in UNet change detection:', error);
      throw error;
    }
  }

  /**
   * Post-process change mask
   */
  async postprocessChangeMask(prediction, originalWidth, originalHeight) {
    try {
      // Get prediction array
      const predictionData = await prediction.data();
      
      // Reshape to image dimensions
      const shape = prediction.shape;
      const height = shape[1] || 512;
      const width = shape[2] || 512;
      
      // Apply threshold (0.5)
      const threshold = 0.5;
      const thresholdTensor = tf.scalar(threshold);
      const binaryMask = tf.greater(prediction, thresholdTensor);
      
      // Find connected components (change regions)
      const changeRegions = await this.findChangeRegions(binaryMask, width, height);
      
      // Clean up
      thresholdTensor.dispose();
      
      return {
        mask: binaryMask,
        regions: changeRegions,
        confidence: Array.from(predictionData)
      };
    } catch (error) {
      console.error('Error in postprocessing:', error);
      // Return empty results on error
      return {
        mask: null,
        regions: [],
        confidence: []
      };
    }
  }

  /**
   * Find change regions from mask
   */
  async findChangeRegions(mask, width, height) {
    try {
      // In production, use connected components algorithm
      // For now, return simplified regions
      const maskData = await mask.data();
      const regions = [];
      
      // Limit processing for performance (sample every 4 pixels)
      const sampleRate = 4;
      const visited = new Set();
      
      for (let y = 0; y < height; y += sampleRate) {
        for (let x = 0; x < width; x += sampleRate) {
          const idx = y * width + x;
          if (idx < maskData.length && maskData[idx] > 0.5 && !visited.has(idx)) {
            // Found a change region
            const region = {
              id: regions.length,
              pixels: [[x, y]],
              bbox: { x, y, x2: x, y2: y }
            };
            
            // Simple flood fill (in production, use proper algorithm)
            this.floodFill(maskData, visited, x, y, width, height, region, sampleRate);
            
            // Only add significant regions (min 10 pixels)
            if (region.pixels.length >= 10) {
              regions.push(region);
            }
          }
        }
      }
      
      return regions.slice(0, 20); // Limit to 20 regions max
    } catch (error) {
      console.error('Error finding change regions:', error);
      return [];
    }
  }

  /**
   * Simple flood fill for region detection
   */
  floodFill(maskData, visited, startX, startY, width, height, region, sampleRate = 1) {
    const stack = [[startX, startY]];
    const maxPixels = 1000; // Limit region size
    
    while (stack.length > 0 && region.pixels.length < maxPixels) {
      const [x, y] = stack.pop();
      const idx = y * width + x;
      
      if (x < 0 || x >= width || y < 0 || y >= height || idx >= maskData.length || 
          visited.has(idx) || (maskData[idx] || 0) < 0.5) {
        continue;
      }
      
      visited.add(idx);
      region.pixels.push([x, y]);
      region.bbox.x = Math.min(region.bbox.x, x);
      region.bbox.y = Math.min(region.bbox.y, y);
      region.bbox.x2 = Math.max(region.bbox.x2, x);
      region.bbox.y2 = Math.max(region.bbox.y2, y);
      
      // Add neighbors (with sample rate)
      if (sampleRate === 1) {
        stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
      } else {
        stack.push([x + sampleRate, y], [x - sampleRate, y], [x, y + sampleRate], [x, y - sampleRate]);
      }
    }
  }

  /**
   * Run Mask R-CNN building detection
   */
  async detectBuildingsWithMaskRCNN(image, changeRegions = []) {
    if (!this.modelsLoaded) {
      await this.loadModels();
    }

    try {
      // Load image
      const img = await this.loadImageElement(image.url || image);
      
      // Preprocess for Mask R-CNN (resize to 800x800 typically)
      const tensor = tf.browser.fromPixels(img);
      const resized = tf.image.resizeBilinear(tensor, [800, 800]);
      const normalized = resized.div(255.0);
      const batched = normalized.expandDims(0);
      
      // Run inference
      const predictions = this.maskRCNNModel.predict(batched);
      
      // Post-process to get building detections
      const buildings = await this.postprocessMaskRCNN(predictions, img.width, img.height);
      
      // Filter buildings in change regions if provided
      if (changeRegions.length > 0) {
        return this.filterBuildingsInChangeRegions(buildings, changeRegions);
      }
      
      // Clean up
      tensor.dispose();
      resized.dispose();
      normalized.dispose();
      batched.dispose();
      predictions.dispose();
      
      return buildings;
    } catch (error) {
      console.error('Error in Mask R-CNN building detection:', error);
      throw error;
    }
  }

  /**
   * Post-process Mask R-CNN predictions
   */
  async postprocessMaskRCNN(predictions, originalWidth, originalHeight) {
    // In production, parse actual Mask R-CNN output format
    // Output typically includes: boxes, scores, masks, classes
    const buildings = [];
    
    // For placeholder, return simulated detections
    // In production, parse actual model output
    if (Array.isArray(predictions)) {
      const [boxes, scores, masks, classes] = predictions;
      
      // Process each detection
      const numDetections = Math.min(boxes.shape[1] || 0, 100); // Limit to 100
      
      for (let i = 0; i < numDetections; i++) {
        const score = scores.dataSync()[i];
        if (score > 0.5) { // Confidence threshold
          const box = boxes.slice([0, i], [1, 1]).squeeze();
          const cls = classes.dataSync()[i];
          
          buildings.push({
            id: `building_${i}`,
            bbox: {
              x: box.dataSync()[0] * originalWidth,
              y: box.dataSync()[1] * originalHeight,
              width: (box.dataSync()[2] - box.dataSync()[0]) * originalWidth,
              height: (box.dataSync()[3] - box.dataSync()[1]) * originalHeight
            },
            mask: masks ? masks.slice([0, i], [1, 1]) : null,
            confidence: score,
            class: cls
          });
        }
      }
    }
    
    return buildings;
  }

  /**
   * Filter buildings that are in change regions
   */
  filterBuildingsInChangeRegions(buildings, changeRegions) {
    return buildings.filter(building => {
      const bbox = building.bbox;
      const centerX = bbox.x + bbox.width / 2;
      const centerY = bbox.y + bbox.height / 2;
      
      return changeRegions.some(region => {
        const r = region.bbox;
        return centerX >= r.x && centerX <= r.x2 && centerY >= r.y && centerY <= r.y2;
      });
    });
  }

  /**
   * Load image element from URL
   */
  loadImageElement(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }

  /**
   * Create placeholder UNet model (for demo when real model not available)
   */
  createPlaceholderUNet() {
    // Simple sequential model that mimics UNet structure
    const model = tf.sequential({
      layers: [
        tf.layers.conv2d({
          inputShape: [512, 512, 6],
          filters: 64,
          kernelSize: 3,
          activation: 'relu',
          padding: 'same'
        }),
        tf.layers.conv2d({
          filters: 32,
          kernelSize: 3,
          activation: 'relu',
          padding: 'same'
        }),
        tf.layers.conv2d({
          filters: 1,
          kernelSize: 1,
          activation: 'sigmoid',
          padding: 'same'
        })
      ]
    });
    
    return model;
  }

  /**
   * Create placeholder Mask R-CNN model
   */
  createPlaceholderMaskRCNN() {
    // Placeholder - in production, use actual Mask R-CNN architecture
    return {
      predict: async (input) => {
        // Return placeholder predictions
        return {
          boxes: tf.zeros([1, 10, 4]),
          scores: tf.ones([1, 10]).mul(0.8),
          masks: tf.zeros([1, 10, 28, 28]),
          classes: tf.ones([1, 10])
        };
      }
    };
  }
}

// Export singleton instance
export const mlModelService = new MLModelService();
