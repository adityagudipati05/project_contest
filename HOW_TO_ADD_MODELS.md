# How to Add Pre-trained UNet and Mask R-CNN Models

## Current Status

✅ **ML Infrastructure Ready**: The system is now set up to use UNet and Mask R-CNN models
✅ **TensorFlow.js Installed**: Ready for model inference
✅ **Fallback System**: If models aren't available, system falls back gracefully

## Where to Place Models

### Option 1: Local Models (Public Folder)

Place your model files in `public/models/`:

```
public/
  models/
    unet-change-detection/
      model.json          # Model architecture
      weights.bin         # Model weights (or split into multiple .bin files)
    mask-rcnn-buildings/
      model.json
      weights.bin
```

### Option 2: Remote Model Server

Update model URLs in `src/services/mlModelService.js`:

```javascript
const modelUrl = 'https://your-server.com/models/unet-change-detection/model.json';
```

## Model Requirements

### UNet Model
- **Input Shape**: `[1, 512, 512, 6]` (batch, height, width, channels)
  - Channels 0-2: Before image (RGB)
  - Channels 3-5: After image (RGB)
- **Output Shape**: `[1, 512, 512, 1]` (change mask)
- **Output**: Binary or probability mask (0-1)

### Mask R-CNN Model
- **Input Shape**: `[1, 800, 800, 3]` (RGB image)
- **Output**: Object with:
  - `boxes`: Bounding boxes `[batch, num_detections, 4]`
  - `scores`: Confidence scores `[batch, num_detections]`
  - `masks`: Segmentation masks `[batch, num_detections, height, width]`
  - `classes`: Class IDs `[batch, num_detections]`

## Converting Models to TensorFlow.js Format

### From Keras/TensorFlow SavedModel:

```python
import tensorflowjs as tfjs

# For UNet
tfjs.converters.save_keras_model(unet_model, 'public/models/unet-change-detection/')

# For Mask R-CNN
tfjs.converters.convert_tf_saved_model(
    'path/to/mask_rcnn_saved_model',
    'public/models/mask-rcnn-buildings/'
)
```

### From PyTorch:

```python
import torch
import tfjs

# Convert PyTorch model to TensorFlow.js
# (requires additional conversion tools)
```

## Model Training Resources

### For UNet (Change Detection):
- **Dataset**: HRSCD, LEVIR-CD, or custom Hyderabad dataset
- **Architecture**: Standard UNet or UNet++ 
- **Loss Function**: Binary Cross-Entropy or Dice Loss
- **Example Implementation**: https://github.com/wgcban/ChangeFormer

### For Mask R-CNN (Building Detection):
- **Dataset**: SpaceNet, WHU Building Dataset, or custom
- **Framework**: Detectron2, TensorFlow Object Detection API
- **Example**: https://github.com/facebookresearch/detectron2

## Testing Models

Once models are placed:

1. **Check Browser Console**: Look for model loading messages
   - ✅ "UNet model loaded successfully"
   - ✅ "Mask R-CNN model loaded successfully"

2. **Test Detection**: Run a site check and verify:
   - Models are used (check "Detection Method" in UI)
   - Results are more accurate than fallback

3. **Debug Issues**: Check console for:
   - Model loading errors
   - Shape mismatches
   - Inference errors

## Current Behavior

- **If models found**: Uses UNet + Mask R-CNN for detection
- **If models not found**: Falls back to simulated detection (current default)
- **Error handling**: Graceful fallback on any ML errors

## Next Steps

1. **Train or obtain models**:
   - Train on Hyderabad satellite imagery dataset
   - Or use pre-trained models and fine-tune

2. **Place models** in `public/models/` directory

3. **Test** - models will be automatically loaded and used

4. **Monitor performance** - check console logs and detection accuracy

---

**Note**: The system is production-ready once you add actual trained models!

