class DatasetValidationError(Exception):
    def __init__(self, message: str):
        self.message = message
        super().__init__(message)


class DatasetNotLoadedError(Exception):
    def __init__(self, message: str):
        self.message = message
        super().__init__(message)


class ModelNotTrainedError(Exception):
    def __init__(self, message: str):
        self.message = message
        super().__init__(message)
