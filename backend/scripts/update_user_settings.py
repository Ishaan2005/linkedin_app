import sys
from pathlib import Path

# Add backend directory to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from database import SessionLocal
from models import UserSettings

TARGET_ROLES = [
    "RTL Design Engineer",
    "Physical Design Engineer",
    "Design Verification Engineer",
    "ASIC Design Engineer",
    "Digital Design Engineer",
    "RTL Intern",
    "Physical Design Intern",
    "Design Verification Intern",
    "VLSI Intern",
    "ASIC Design Manager",
    "RTL Lead",
    "Verification Lead",
    "Physical Design Lead",
    "VLSI Manager",
    "Hiring Manager",
    "Engineering Manager",
    "Technical Lead",
    "Technical Recruiter",
]

TARGET_TECHNICAL_SKILLS = [
    "RTL Design",
    "Physical Design",
    "Design Verification",
    "VLSI",
    "ASIC",
    "RTL",
    "Digital Design",
    "Verilog",
    "SystemVerilog",
    "SoC",
    "FPGA",
    "UVM",
    "STA",
    "Synthesis",
    "ASIC Verification",
    "Functional Verification",
    "Place and Route",
    "Timing Closure",
]

TARGET_LOCATIONS = [
    "Ahmedabad",
    "Gujarat",
    "Bangalore",
    "Noida",
    "Hyderabad",
]

TARGET_COMPANIES = [
    "Skychip",
    "Quest Global",
    "ASICCraft",
    "Pronesis",
    "KeenSemi",
    "PravegSemi",
    "Exemitas Design",
    "VeerVX",
    "MosChip",
    "Truechip",
    "Verifast",
    "Vicharak",
    "MumbaiSemi",
    "proteanTecs",
    "Incise Infotech",
    "Cyient Semiconductors",
    "Chip Smart Technologies",
    "AumRaj Design Systems",
    "Mirafra",
    "INDSEMI TECH",
    "PulseWave Semiconductor",
    "SmartSoC Solutions",
    "RRP Electronics",
    "CG Semi",
    "Nordic Semiconductor",
    "indie Semiconductor / IndieSemi",
    "ScaleEdge Technology",
    "Renesas Electronics",
    "SuchiLogic",
    "Suchi Semicon",
    "Kaynes Semicon",
    "Insemi Technology Services",
    "Blueberry Semiconductors",
    "SignOff Semiconductors",
    "TRISEMI TECHNOLOGIES",
    "Radiant Semiconductors",
    "Digicomm Semiconductor",
    "NetraSemi",
    "Trident Techlabs",
    "eInfochips",
    "Green Semiconductors",
    "SK hynix",
    "Marvell Technology",
    "Rambus",
    "Sankalp Semiconductor",
    "Cypress Semiconductor",
]

PRIORITY_COMPANIES = [
    "NVIDIA",
    "Tessolve",
    "MediaTek",
    "SanDisk",
    "Micron",
    "Synopsys",
    "Infineon",
    "NXP",
    "Qualcomm",
    "NXP India",
    "Intel",
    "Google",
    "Arm",
    "AMD",
    "Texas Instruments",
    "Altera",
    "Cisco",
    "Nokia",
    "IBM",
]


def update_settings():
    db = SessionLocal()
    try:
        settings = db.query(UserSettings).filter(UserSettings.id == 1).first()
        if not settings:
            settings = UserSettings(id=1)
            db.add(settings)

        settings.target_roles = TARGET_ROLES
        settings.target_technical_skills = TARGET_TECHNICAL_SKILLS
        settings.target_locations = TARGET_LOCATIONS
        settings.target_companies = TARGET_COMPANIES
        settings.priority_companies = PRIORITY_COMPANIES
        settings.daily_lead_target = 15
        settings.min_relevance_score = 60.0

        db.commit()
        db.refresh(settings)
        print("Successfully updated UserSettings row 1 in SQLite:")
        print(f"  Target Roles: {len(settings.target_roles)}")
        print(f"  Target Technical Skills: {len(settings.target_technical_skills)}")
        print(f"  Target Locations: {len(settings.target_locations)}")
        print(f"  Target Companies: {len(settings.target_companies)}")
        print(f"  Priority Companies: {len(settings.priority_companies)}")
    finally:
        db.close()


if __name__ == "__main__":
    update_settings()
