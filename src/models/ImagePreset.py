from typing import List, Optional

class ImagePreset:
    def __init__(self, id: int, name: str, crop_ratio: float, default_filters: Optional[List[str]], workspace: 'Workspace'):
        self.id = id
        self.name = name
        self.crop_ratio = crop_ratio
        self.default_filters = default_filters or []
        self.workspace = workspace

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'crop_ratio': self.crop_ratio,
            'default_filters': self.default_filters,
            'workspace_id': self.workspace.id if self.workspace else None
        }
