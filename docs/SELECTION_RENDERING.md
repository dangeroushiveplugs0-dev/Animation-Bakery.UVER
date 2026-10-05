# Selection Rendering Strategy

UVER does not use full-model wireframe highlighting as the default selection effect.

## Object selection
Selecting a whole model, mesh, bone group, or object uses a lightweight bounding outline. It does not create a highlighted edge for every triangle.

## Part selection
Selecting a sub-object can use a local outline around the selected region rather than highlighting the entire model.

## Face selection
Face editing is distance-aware:
- nearby faces may receive detailed selection highlighting;
- distant geometry is not continuously highlighted;
- unselected distant wireframe is hidden;
- the active editing region receives the expensive visualization budget.

## Rendering budget
Selection rendering has its own budget and must never force a full-resolution wireframe of a large mesh. The selection system should prefer screen-space visibility and camera distance over raw triangle count.

The imported/editable mesh remains untouched. Selection visualization is an overlay.
