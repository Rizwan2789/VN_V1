from pydantic import BaseModel


class BatchResponse(BaseModel):
    id: int
    name: str
    grade_level: int

    model_config = {"from_attributes": True}
