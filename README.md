# Animation-Bakery.UVER

Mobile-first 3D utility app for artists.

## MVP 0.1.0
- Three.js WebGL2 viewport
- Touch-friendly camera controls using the open-source `camera-controls` library
- Visible grid, lighting and test cube
- Rapier 3D physics engine initialized behind a modular PhysicsEngine boundary
- Capacitor Android container
- GitHub Actions debug APK build

## Architecture
Engine code stays modular so rendering, camera, physics, importing, painting, rigging and materials can grow independently.

Planned modules include:
- SceneManager
- CameraControls
- PhysicsEngine / PhysicsSync
- TexturePainter / UVPicker
- AssetManager / VariantManager
- GLTFImporter / OBJImporter / BLENDImporter
- Blender Model Controls adapter
- SkeletonManager / BoneManager / WeightManager
- Wetness material extension
- Export pipeline

## UVER / SVER
UVER is the current unrestricted creator build. A future SVER store build can share the same core codebase through build/content configuration instead of duplicating the project.

## Mobile-first rules
- WebGL2 first
- capped pixel ratio
- touch input
- fixed-step physics
- modular files
- avoid unnecessary allocations
- dispose GPU resources
