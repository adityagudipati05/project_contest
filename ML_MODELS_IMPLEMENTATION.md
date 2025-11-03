# ML Models Implementation Guide for Illegal Construction Detection

## Current Status
**⚠️ The current implementation uses SIMULATED change detection, not actual ML models.**

## Recommended Pre-trained Models for Production

### 1. **UNet Architecture** (Change Detection)
- **Purpose**: Pixel-level change detection in satellite imagery
- **Use Case**: Detect where construction has occurred between two time periods
- **Pre-trained Options**:
  - **ChangeNet**: Pre-trained on satellite imagery change detection
  - **HRSCD Dataset Models**: Trained on high-resolution satellite change detection
  - **Custom UNet**: Train on your own before/after satellite image pairs

**Implementation Approach**:
```javascript
// Example with TensorFlow.js
import * as tf from '@tensorflow/tfjs';

const loadChangeDetectionModel = async () => {
  // Load pre-trained UNet model
  const model = await tf.loadLayersModel('path/to/unet-model.json');
  return model;
};

const detectChanges = async (beforeImage, afterImage) => {
  const model = await loadChangeDetectionModel();
  
  // Preprocess images
  const beforeTensor = tf.browser.fromPixels(beforeImage);
  const afterTensor = tf.browser.fromPixels(afterImage);
  
  // Stack images as input
  const input = tf.concat([beforeTensor, afterTensor], 2);
  
  // Run inference
  const prediction = model.predict(input);
  
  // Post-process to get change mask
  return prediction;
};
```

### 2. **Mask R-CNN** (Object Detection & Segmentation)
- **Purpose**: Detect and segment individual buildings/constructions
- **Use Case**: Identify specific construction sites and their boundaries
- **Pre-trained Options**:
  - **Detectron2**: Facebook's implementation with pre-trained models
  - **TensorFlow Object Detection API**: Pre-trained on COCO dataset
  - **Custom trained**: On building/construction datasets

**Implementation Approach**:
```javascript
// Using TensorFlow.js or backend API
const detectBuildings = async (image) => {
  // Load Mask R-CNN model
  const model = await loadMaskRCNNModel();
  
  // Run inference
  const detections = await model.detect(image);
  
  // Returns: bounding boxes, masks, class IDs, confidence scores
  return detections;
};
```

### 3. **Siamese Network** (Similarity-based Change Detection)
- **Purpose**: Compare before/after images to find differences
- **Use Case**: More efficient for large-scale comparisons
- **Pre-trained Options**:
  - **Contrastive Loss Siamese Networks**
  - **Triplet Loss Networks**

### 4. **DeepLabV3+** (Semantic Segmentation)
- **Purpose**: Classify each pixel (building, road, water, vegetation)
- **Use Case**: Understand land use and identify illegal zones
- **Pre-trained Options**:
  - **DeepLabV3+**: Pre-trained on Cityscapes/PASCAL VOC
  - **Custom trained**: On Hyderabad-specific satellite imagery

## Recommended Dataset Sources for Training

1. **HRSCD (High Resolution Satellite Change Detection)**
   - 291 high-resolution image pairs
   - Change detection labels

2. **WHU Building Dataset**
   - 22,000+ building footprints
   - Aerial imagery

3. **SpaceNet Buildings Dataset**
   - Building footprints from satellite imagery

4. **Custom Hyderabad Dataset**
   - Label before/after imagery from 2006-2024
   - Include protected zones (waterbodies, green belts)

## Implementation Architecture Options

### Option 1: Frontend (TensorFlow.js)
```javascript
// Pros: Real-time, no backend needed
// Cons: Large model files, limited performance

import * as tf from '@tensorflow/tfjs';
const model = await tf.loadLayersModel('/models/unet-model.json');
```

### Option 2: Backend API (Python + TensorFlow/PyTorch)
```python
# Pros: Better performance, can use larger models
# Cons: Requires backend server

from tensorflow import keras
model = keras.models.load_model('unet_change_detection.h5')

@app.route('/detect-changes', methods=['POST'])
def detect_changes():
    before_img = process_image(request.files['before'])
    after_img = process_image(request.files['after'])
    
    changes = model.predict([before_img, after_img])
    return jsonify(changes)
```

### Option 3: Hybrid (Edge + Cloud)
- Lightweight model on frontend for quick preview
- Heavy processing on backend for final results

## Specific Models for This Project

### Recommended Stack:

1. **Change Detection**: 
   - **UNet** trained on HRSCD or custom Hyderabad dataset
   - Input: 512x512 RGB image pairs (2006 vs current)
   - Output: Change mask highlighting new constructions

2. **Building Segmentation**:
   - **DeepLabV3+** or **UNet** for building detection
   - Identify building footprints in detected change areas

3. **Validation**:
   - **GIS Layer Overlay** (already implemented)
   - Check if detected buildings violate protected zones

## Integration Steps

1. **Collect Training Data**:
   - Gather Hyderabad satellite imagery from 2006 and current
   - Label change areas manually
   - Create training dataset

2. **Train or Fine-tune Model**:
   - Start with pre-trained UNet
   - Fine-tune on Hyderabad-specific data
   - Validate on test set

3. **Convert to TensorFlow.js** (for frontend) or deploy as API (backend)

4. **Replace Simulated Detection**:
   - Replace `detectChanges()` function
   - Use actual model inference

## Example Integration Code

```javascript
// src/services/mlModelService.js

import * as tf from '@tensorflow/tfjs';

class ChangeDetectionModel {
  constructor() {
    this.model = null;
    this.loaded = false;
  }

  async load() {
    try {
      // Load pre-trained UNet model
      this.model = await tf.loadLayersModel('/models/unet-change-detection/model.json');
      this.loaded = true;
      console.log('Change detection model loaded');
    } catch (error) {
      console.error('Failed to load model:', error);
      throw error;
    }
  }

  async predict(beforeImage, afterImage) {
    if (!this.loaded) await this.load();

    // Preprocess images
    const beforeTensor = this.preprocessImage(beforeImage);
    const afterTensor = this.preprocessImage(afterImage);

    // Stack as input
    const input = tf.concat([beforeTensor, afterTensor], 2);

    // Run inference
    const prediction = this.model.predict(input);

    // Post-process
    const changeMask = await this.postprocess(prediction);

    return changeMask;
  }

  preprocessImage(image) {
    // Resize, normalize, etc.
    return tf.browser.fromPixels(image)
      .resizeNearestNeighbor([512, 512])
      .div(255.0);
  }

  postprocess(prediction) {
    // Convert prediction to change mask
    // Apply threshold
    // Extract bounding boxes
    return prediction;
  }
}

export const changeDetectionModel = new ChangeDetectionModel();
```

## Next Steps

1. **For Demo/Prototype**: Current simulated detection works fine
2. **For Production**: 
   - Collect labeled dataset
   - Train/fine-tune UNet model
   - Integrate model inference
   - Replace simulated detection

## Resources

- **TensorFlow.js Models**: https://www.tensorflow.org/js/models
- **HRSCD Dataset**: https://github.com/wgcban/ChangeFormer
- **Change Detection Papers**: https://github.com/wgcban/ChangeFormer#related-works
- **Building Detection**: https://github.com/lopuhin/coco-annotator

---

**Note**: The current implementation serves as a complete UI/UX prototype. The ML model integration can be added when you have:
1. Training data
2. Computational resources
3. Time for model training/fine-tuning
