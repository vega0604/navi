from enum import Enum

class DisabilityCategory(str, Enum):
    MOBILITY_IMPAIRED = "mobility impairment"
    VISUALLY_IMPAIRED = "visual impairment"
    LIGHT_SENSITIVE = "light sensitivity"
    SOUND_SENSITIVE = "sound sensitivity"
    CHRONICALLY_FATIGUED = "chronic fatigue"