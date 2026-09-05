import re
from typing import List, Optional, Set, Tuple

# Canonical company alias mapping
COMPANY_ALIASES = {
    "nxp": "nxp",
    "nxpindia": "nxp",
    "qualcomm": "qualcomm",
    "qualcommindia": "qualcomm",
    "qualcommtechnologies": "qualcomm",
    "skhynix": "skhynix",
    "renesas": "renesas",
    "renesaselectronics": "renesas",
    "marvell": "marvell",
    "marvelltechnology": "marvell",
    "texasinstruments": "texasinstruments",
    "texasinstrumentsindia": "texasinstruments",
    "ti": "texasinstruments",
    "tiindia": "texasinstruments",
    "indiesemiconductor": "indiesemi",
    "indiesemi": "indiesemi",
    "suchilogic": "suchisemicon",
    "suchisemicon": "suchisemicon",
    "suchisemiconpvtltd": "suchisemicon",
    "intel": "intel",
    "intelcorporation": "intel",
    "intelindia": "intel",
    "amd": "amd",
    "amdindia": "amd",
    "arm": "arm",
    "armholdings": "arm",
    "armindia": "arm",
    "cadence": "cadence",
    "cadencedesignsystems": "cadence",
    "synopsys": "synopsys",
    "synopsysindia": "synopsys",
    "mediatek": "mediatek",
    "mediatekindia": "mediatek",
    "einfochips": "einfochips",
    "moschip": "moschip",
    "truechip": "truechip",
    "sandisk": "sandisk",
    "micron": "micron",
    "infineon": "infineon",
    "tessolve": "tessolve",
}

# Gujarat cities to automatically satisfy Gujarat / Ahmedabad region
GUJARAT_CITIES = {
    "ahmedabad", "gandhinagar", "vadodara", "baroda", "surat", "rajkot",
    "bhavnagar", "jamnagar", "anand", "morbi", "mehsana", "sanand", "gujarat"
}


def normalize_name(name: Optional[str]) -> str:
    if not name:
        return ""
    cleaned = name.strip()
    cleaned = re.sub(r'^(dr|mr|mrs|ms|prof)\.?\s+', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\s+', ' ', cleaned)
    return cleaned.strip()


def normalize_company(company: Optional[str]) -> str:
    if not company:
        return ""
    comp = company.strip()
    comp = re.sub(r'\s+', ' ', comp)
    return comp


def canonical_company_key(company: Optional[str]) -> str:
    """Produces a canonical lowercased company key without legal suffixes for matching and dedup."""
    if not company:
        return ""
    comp = company.strip().lower()
    # Strip common corporate and geographic suffixes conservatively
    comp = re.sub(
        r'\b(pvt\s+ltd|private\s+limited|ltd|limited|inc|incorporated|corp|corporation|llc|technologies|technology|systems|system|semiconductors?|solutions|services|india)\b\.?',
        '',
        comp,
        flags=re.IGNORECASE
    )
    comp = re.sub(r'[^a-z0-9]', '', comp)
    if not comp:
        return ""

    # Check known alias table
    return COMPANY_ALIASES.get(comp, comp)


def normalize_location(location: Optional[str]) -> str:
    if not location:
        return ""
    loc = location.strip()
    loc_lower = loc.lower()

    if "ahmedabad" in loc_lower:
        return "Ahmedabad, Gujarat, India"
    if any(city in loc_lower for city in ["gandhinagar", "vadodara", "baroda", "surat", "rajkot"]) or "gujarat" in loc_lower:
        matched_city = next((c.capitalize() for c in ["gandhinagar", "vadodara", "surat", "rajkot"] if c in loc_lower), "Gujarat")
        return f"{matched_city}, Gujarat, India"
    if "bengaluru" in loc_lower or "bangalore" in loc_lower:
        return "Bangalore, India"
    if "hyderabad" in loc_lower:
        return "Hyderabad, India"
    if "pune" in loc_lower:
        return "Pune, India"
    if "noida" in loc_lower or "delhi" in loc_lower or "gurgaon" in loc_lower or "gurugram" in loc_lower:
        return "Noida, India"
    if "austin" in loc_lower:
        return "Austin, TX"
    if "san jose" in loc_lower or "santa clara" in loc_lower or "sunnyvale" in loc_lower:
        return "San Jose, CA"
    if "remote" in loc_lower:
        return "Remote"
    if "india" in loc_lower and "," not in loc:
        return "India"

    return re.sub(r'\s+', ' ', loc).strip()


def is_location_preferred(location: Optional[str], target_locations: List[str]) -> Tuple[bool, str]:
    """
    Checks if a candidate location matches the user's target preferences.
    Handles Ahmedabad <-> Gujarat relationships and city aliases.
    """
    if not location:
        return False, "Unspecified"

    loc_lower = location.lower()
    norm_targets = [t.lower() for t in target_locations]

    # 1. Ahmedabad & Gujarat
    is_gujarat_loc = any(c in loc_lower for c in GUJARAT_CITIES)
    has_gujarat_pref = any("gujarat" in t or "ahmedabad" in t for t in norm_targets)
    if is_gujarat_loc and has_gujarat_pref:
        return True, "Ahmedabad/Gujarat preference match"

    # 2. Bangalore / Bengaluru
    if ("bangalore" in loc_lower or "bengaluru" in loc_lower) and any("bangalore" in t or "bengaluru" in t for t in norm_targets):
        return True, "Bangalore preference match"

    # 3. Noida / Delhi NCR
    if ("noida" in loc_lower or "delhi" in loc_lower or "gurgaon" in loc_lower or "gurugram" in loc_lower) and any("noida" in t or "delhi" in t for t in norm_targets):
        return True, "Noida preference match"

    # 4. Hyderabad
    if "hyderabad" in loc_lower and any("hyderabad" in t for t in norm_targets):
        return True, "Hyderabad preference match"

    # 5. Direct substring match against any custom target location
    for target in target_locations:
        if target.lower() in loc_lower or loc_lower in target.lower():
            return True, f"Target location match ({target})"

    return False, location


def normalize_linkedin_url(url: Optional[str]) -> Optional[str]:
    if not url:
        return None
    cleaned = url.strip()
    if not cleaned or cleaned == "#" or "example.com" in cleaned:
        return None

    cleaned = cleaned.split("?")[0].split("#")[0].rstrip("/")
    if not cleaned:
        return None

    if not cleaned.startswith("http://") and not cleaned.startswith("https://"):
        cleaned = "https://" + cleaned

    if cleaned.startswith("http://"):
        cleaned = "https://" + cleaned[7:]

    return cleaned.lower()


def infer_role_category(title: Optional[str]) -> str:
    if not title:
        return "Other"
    t = title.lower()

    # Decision makers & managers
    if "asic design manager" in t or "asic manager" in t:
        return "ASIC Design Manager"
    if "vlsi manager" in t:
        return "VLSI Manager"
    if "rtl lead" in t or "rtl design lead" in t:
        return "RTL Lead"
    if "verification lead" in t or "dv lead" in t or "design verification lead" in t:
        return "Verification Lead"
    if "physical design lead" in t or "pd lead" in t:
        return "Physical Design Lead"
    if "hiring manager" in t:
        return "Hiring Manager"
    if "engineering manager" in t or "director" in t or "vp " in t or "head of" in t:
        return "Engineering Manager"
    if any(k in t for k in ["technical lead", "tech lead", "principal", "architect", "staff engineer"]):
        return "Technical Lead"

    # Recruiters
    if "technical recruiter" in t or "semiconductor recruiter" in t or "vlsi recruiter" in t:
        return "Technical Recruiter"
    if "talent acquisition" in t or "recruiter" in t or "staffing" in t:
        return "Talent Acquisition"
    if "hr" in t or "human resources" in t or "people partner" in t:
        return "HR"

    # Target engineering roles & internships
    if "rtl" in t and ("intern" in t or "trainee" in t or "graduate" in t):
        return "RTL Intern"
    if "physical design" in t and ("intern" in t or "trainee" in t or "graduate" in t):
        return "Physical Design Intern"
    if ("verification" in t or "dv" in t) and ("intern" in t or "trainee" in t or "graduate" in t):
        return "Design Verification Intern"
    if "vlsi" in t and ("intern" in t or "trainee" in t or "graduate" in t):
        return "VLSI Intern"
    if "rtl" in t and "engineer" in t:
        return "RTL Design Engineer"
    if ("physical design" in t or "pd " in t) and "engineer" in t:
        return "Physical Design Engineer"
    if ("verification" in t or "dv " in t) and "engineer" in t:
        return "Design Verification Engineer"
    if "asic" in t and "engineer" in t:
        return "ASIC Design Engineer"
    if "digital design" in t and "engineer" in t:
        return "Digital Design Engineer"

    return "Other"


def infer_technical_areas(title: Optional[str], known_skills: Optional[List[str]] = None) -> List[str]:
    areas = []
    text = (title or "").lower()
    if known_skills:
        text += " " + " ".join([s.lower() for s in known_skills])

    mapping = [
        (["rtl", "register transfer level"], "RTL"),
        (["verilog"], "Verilog"),
        (["systemverilog", "system verilog", "sv"], "SystemVerilog"),
        (["asic"], "ASIC"),
        (["fpga"], "FPGA"),
        (["physical design", "pd", "place and route", "pnr", "floorplanning", "sta", "timing closure"], "Physical Design"),
        (["verification", "design verification", "uvm", "formal verification", "dv", "functional verification"], "Design Verification"),
        (["vlsi"], "VLSI"),
        (["soc", "system on chip"], "SoC"),
        (["risc-v", "riscv"], "RISC-V"),
        (["synthesis"], "Synthesis"),
        (["sta", "static timing analysis"], "STA"),
        (["computer architecture", "cpu architecture"], "Computer Architecture"),
        (["ai hardware", "npu", "accelerator"], "AI Hardware"),
        (["eda", "cadence", "synopsys"], "EDA"),
        (["semiconductor"], "Semiconductor"),
        (["amba", "apb", "axi"], "AMBA APB"),
        (["digital design"], "Digital Design"),
    ]

    for keywords, area in mapping:
        for kw in keywords:
            if re.search(r'\b' + re.escape(kw) + r'\b', text):
                if area not in areas:
                    areas.append(area)
                break

    return areas
