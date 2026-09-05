import sys
from pathlib import Path

# Add backend directory to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from database import SessionLocal
from models import Lead
from services.normalization import (
    infer_role_category,
    infer_technical_areas,
    normalize_linkedin_url,
    normalize_location,
    normalize_name,
)
from services.scoring import calculate_relevance_score
from services.discovery import _get_or_create_settings

CANDIDATES = [
    {
        "name": "Dr. Rajesh Kulkarni",
        "title": "ASIC Design Manager - Modem & Connectivity",
        "company": "Qualcomm",
        "location": "Bangalore, India",
        "linkedin_url": "https://www.linkedin.com/in/rajesh-kulkarni-asic",
        "notes": "Hiring manager for RTL/ASIC teams in Bangalore modem group.",
    },
    {
        "name": "Anita Venkatesh",
        "title": "RTL Lead - CPU Architecture & Subsystems",
        "company": "Intel Corporation",
        "location": "Bangalore, India",
        "linkedin_url": "https://www.linkedin.com/in/anita-venkatesh-rtl",
        "notes": "Specializes in High Performance Xeon RTL and SystemVerilog.",
    },
    {
        "name": "Siddharth Verma",
        "title": "Senior Director of Silicon Engineering",
        "company": "NVIDIA",
        "location": "Hyderabad, India",
        "linkedin_url": "https://www.linkedin.com/in/siddharth-verma-nv",
        "notes": "Leading GPU architecture and SoC verification teams.",
    },
    {
        "name": "Priyanka Nair",
        "title": "Design Verification Lead (UVM / SystemVerilog)",
        "company": "AMD",
        "location": "Hyderabad, India",
        "linkedin_url": "https://www.linkedin.com/in/priyanka-nair-dv",
        "notes": "Focused on Zen core verification and formal methods.",
    },
    {
        "name": "Vikram Malhotra",
        "title": "VLSI Engineering Manager",
        "company": "Texas Instruments",
        "location": "Bangalore, India",
        "linkedin_url": "https://www.linkedin.com/in/vikram-malhotra-ti",
        "notes": "Embedded processing and mixed-signal ASIC division head.",
    },
    {
        "name": "Sandeep Joshi",
        "title": "Principal Physical Design Lead",
        "company": "Synopsys",
        "location": "Noida, India",
        "linkedin_url": "https://www.linkedin.com/in/sandeep-joshi-pd",
        "notes": "Advanced 3nm/2nm physical implementation & EDA tool flows.",
    },
    {
        "name": "Meera Sundaram",
        "title": "Technical Recruiter - Semiconductor & Hardware Systems",
        "company": "Qualcomm",
        "location": "Bangalore, India",
        "linkedin_url": "https://www.linkedin.com/in/meera-sundaram-recruiter",
        "notes": "Actively recruiting RTL design and verification engineers.",
    },
    {
        "name": "Arjun Deshmukh",
        "title": "Talent Acquisition Lead - VLSI R&D",
        "company": "Cadence Design Systems",
        "location": "Pune, India",
        "linkedin_url": "https://www.linkedin.com/in/arjun-deshmukh-ta",
        "notes": "Coordinates campus and lateral hiring for digital verification.",
    },
    {
        "name": "Kavita Raman",
        "title": "SoC Architecture & Interconnect Lead",
        "company": "ARM",
        "location": "Bangalore, India",
        "linkedin_url": "https://www.linkedin.com/in/kavita-raman-arm",
        "notes": "Expert in AMBA AXI/CHI interconnect protocols.",
    },
    {
        "name": "Abhishek Banerjee",
        "title": "Staff RTL Design Engineer",
        "company": "MediaTek",
        "location": "Noida, India",
        "linkedin_url": "https://www.linkedin.com/in/abhishek-banerjee-rtl",
        "notes": "5G Dimensity smartphone chipset RTL subsystem.",
    },
    {
        "name": "Deepak Patel",
        "title": "Senior Verification Engineer - Formal Verification",
        "company": "Intel Corporation",
        "location": "Bangalore, India",
        "linkedin_url": "https://www.linkedin.com/in/deepak-patel-formal",
        "notes": "Expertise in JasperGold and SVA assertions.",
    },
    {
        "name": "Swati Sengupta",
        "title": "Engineering Manager - RISC-V Core Design",
        "company": "Tenstorrent",
        "location": "Bangalore, India",
        "linkedin_url": "https://www.linkedin.com/in/swati-sengupta-riscv",
        "notes": "AI silicon and high performance RISC-V cores.",
    },
    {
        "name": "Harish Iyer",
        "title": "Hardware Hiring Manager - Custom Silicon",
        "company": "Google",
        "location": "Bangalore, India",
        "linkedin_url": "https://www.linkedin.com/in/harish-iyer-googlesilicon",
        "notes": "TPU and custom server silicon accelerator team.",
    },
    {
        "name": "Sneha Rao",
        "title": "Staff Emulation & FPGA Engineer",
        "company": "Apple",
        "location": "Hyderabad, India",
        "linkedin_url": "https://www.linkedin.com/in/sneha-rao-fpga",
        "notes": "ZeBu and Palladium emulation for next-gen silicon.",
    },
    {
        "name": "Manish Reddy",
        "title": "Technical Lead - Digital ASIC Design",
        "company": "Broadcom",
        "location": "Bangalore, India",
        "linkedin_url": "https://www.linkedin.com/in/manish-reddy-broadcom",
        "notes": "Network switch ASIC switching fabric design.",
    },
    {
        "name": "Rohan Bhatia",
        "title": "Lead Physical Verification & Signoff Engineer",
        "company": "Samsung Semiconductor",
        "location": "Bangalore, India",
        "linkedin_url": "https://www.linkedin.com/in/rohan-bhatia-samsung",
        "notes": "Foundry interface, DRC/LVS and static timing analysis (STA).",
    },
    {
        "name": "Sunita Menon",
        "title": "HR Business Partner - Semiconductor Technology Group",
        "company": "NVIDIA",
        "location": "Pune, India",
        "linkedin_url": "https://www.linkedin.com/in/sunita-menon-hr",
        "notes": "People operations for hardware engineering divisions.",
    },
    {
        "name": "Gaurav Agarwal",
        "title": "Senior ASIC Verification Engineer (SystemVerilog/UVM)",
        "company": "Marvell Technology",
        "location": "Pune, India",
        "linkedin_url": "https://www.linkedin.com/in/gaurav-agarwal-marvell",
        "notes": "PCIe Gen 5/6 controller IP verification.",
    },
    {
        "name": "Divya Krishnan",
        "title": "RTL Design & Synthesis Lead",
        "company": "Microchip Technology",
        "location": "Bangalore, India",
        "linkedin_url": "https://www.linkedin.com/in/divya-krishnan-rtl",
        "notes": "Microcontroller core logic design and low power synthesis.",
    },
    {
        "name": "Amitabh Sen",
        "title": "Senior Technical Recruiter",
        "company": "Intel Corporation",
        "location": "Bangalore, India",
        "linkedin_url": "https://www.linkedin.com/in/amitabh-sen-intelrecruiter",
        "notes": "Specializes in silicon and hardware packaging roles.",
    },
    {
        "name": "Tarun Kapoor",
        "title": "SoC Verification Specialist",
        "company": "Qualcomm",
        "location": "Hyderabad, India",
        "linkedin_url": "https://www.linkedin.com/in/tarun-kapoor-soc",
        "notes": "Snapdragon subsystem verification and coverage closure.",
    },
    {
        "name": "Nidhi Sharma",
        "title": "Hardware Systems Director",
        "company": "Texas Instruments",
        "location": "Bangalore, India",
        "linkedin_url": "https://www.linkedin.com/in/nidhi-sharma-ti",
        "notes": "High-speed interface and power management architectures.",
    },
    {
        "name": "Karthik Chandran",
        "title": "Principal Architect - AI Accelerators",
        "company": "AMD",
        "location": "Bangalore, India",
        "linkedin_url": "https://www.linkedin.com/in/karthik-chandran-amd",
        "notes": "ROCm hardware acceleration and compute engine pipelines.",
    },
    {
        "name": "Varun Mehta",
        "title": "VLSI Design Engineer - Digital RTL",
        "company": "NXP Semiconductors",
        "location": "Noida, India",
        "linkedin_url": "https://www.linkedin.com/in/varun-mehta-nxp",
        "notes": "Automotive radar processing and security ASICs.",
    },
    {
        "name": "Shreya Mukherjee",
        "title": "Staff Verification Engineer",
        "company": "Synopsys",
        "location": "Bangalore, India",
        "linkedin_url": "https://www.linkedin.com/in/shreya-mukherjee-synopsys",
        "notes": "Verification IP development and protocol verification.",
    },
    {
        "name": "Aditya Saxena",
        "title": "Full Stack Web Developer (Python/React)",
        "company": "Fintech Solutions",
        "location": "Bangalore, India",
        "linkedin_url": "https://www.linkedin.com/in/aditya-saxena-webdev",
        "notes": "Unrelated non-hardware candidate for score calibration testing.",
    },
    {
        "name": "Preeti Goswami",
        "title": "Customer Support Executive",
        "company": "E-Commerce Logistics",
        "location": "Mumbai, India",
        "linkedin_url": "https://www.linkedin.com/in/preeti-goswami-cs",
        "notes": "Non-technical control profile to verify low score filtering.",
    },
    {
        "name": "Raghavendra Hegde",
        "title": "ASIC Design Manager - High Speed SerDes",
        "company": "Cadence Design Systems",
        "location": "Bangalore, India",
        "linkedin_url": "https://www.linkedin.com/in/raghavendra-hegde-asic",
        "notes": "112G/224G SerDes physical layer and PAM4 design lead.",
    },
]


def seed_candidates():
    db = SessionLocal()
    try:
        settings = _get_or_create_settings(db)
        inserted_count = 0
        skipped_count = 0

        for cand in CANDIDATES:
            name = normalize_name(cand["name"])
            title = cand["title"]
            company = cand["company"]
            location = normalize_location(cand["location"])
            url = normalize_linkedin_url(cand["linkedin_url"])

            # Check if exists by URL
            existing = None
            if url:
                existing = db.query(Lead).filter(Lead.linkedin_url == url).first()
            if not existing:
                existing = (
                    db.query(Lead)
                    .filter(Lead.name == name, Lead.company == company)
                    .first()
                )

            if existing:
                skipped_count += 1
                continue

            role_category = infer_role_category(title)
            technical_areas = infer_technical_areas(title)

            score_res = calculate_relevance_score(
                {
                    "title": title,
                    "company": company,
                    "location": location,
                    "role_category": role_category,
                    "technical_areas": technical_areas,
                },
                settings,
                has_associated_job=False,
            )

            new_lead = Lead(
                name=name,
                title=title,
                company=company,
                location=location,
                linkedin_url=url,
                relevance_score=score_res["score"],
                score_breakdown=score_res["breakdown"],
                recommendation_reason=score_res["recommendation_reason"],
                technical_areas=technical_areas,
                role_category=role_category,
                status="NEW",
                notes=cand["notes"],
            )
            db.add(new_lead)
            inserted_count += 1

        db.commit()
        print(f"Seed complete: {inserted_count} candidates inserted, {skipped_count} skipped (already existed).")
    finally:
        db.close()


if __name__ == "__main__":
    seed_candidates()
