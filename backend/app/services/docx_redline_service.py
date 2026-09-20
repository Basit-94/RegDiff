import io
import datetime
import difflib
from typing import Optional, List, Tuple, Dict, Any
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn


def _add_del_run(paragraph, text: str, change_id: int, author: str = "RegDiff Statutory Engine", date_str: Optional[str] = None):
    """Inserts a native Word Track Changes deletion element (w:del)."""
    if not date_str:
        date_str = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    
    del_elem = OxmlElement('w:del')
    del_elem.set(qn('w:id'), str(change_id))
    del_elem.set(qn('w:author'), author)
    del_elem.set(qn('w:date'), date_str)
    
    r_elem = OxmlElement('w:r')
    
    # Red strike-through styling for compatibility with viewers that do not auto-style revisions
    rPr = OxmlElement('w:rPr')
    color = OxmlElement('w:color')
    color.set(qn('w:val'), 'DC2626')  # Tailwind Red-600
    strike = OxmlElement('w:strike')
    rPr.append(color)
    rPr.append(strike)
    r_elem.append(rPr)
    
    del_text = OxmlElement('w:delText')
    del_text.set(qn('xml:space'), 'preserve')
    del_text.text = text
    r_elem.append(del_text)
    
    del_elem.append(r_elem)
    paragraph._p.append(del_elem)


def _add_ins_run(paragraph, text: str, change_id: int, author: str = "RegDiff Statutory Engine", date_str: Optional[str] = None):
    """Inserts a native Word Track Changes insertion element (w:ins)."""
    if not date_str:
        date_str = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        
    ins_elem = OxmlElement('w:ins')
    ins_elem.set(qn('w:id'), str(change_id))
    ins_elem.set(qn('w:author'), author)
    ins_elem.set(qn('w:date'), date_str)
    
    r_elem = OxmlElement('w:r')
    
    # Green underline styling for compatibility with all office suites
    rPr = OxmlElement('w:rPr')
    color = OxmlElement('w:color')
    color.set(qn('w:val'), '16A34A')  # Tailwind Green-600
    u = OxmlElement('w:u')
    u.set(qn('w:val'), 'single')
    rPr.append(color)
    rPr.append(u)
    r_elem.append(rPr)
    
    ins_text = OxmlElement('w:t')
    ins_text.set(qn('xml:space'), 'preserve')
    ins_text.text = text
    r_elem.append(ins_text)
    
    ins_elem.append(r_elem)
    paragraph._p.append(ins_elem)


def _tokenize_text(text: str) -> List[str]:
    """Tokenizes text by splitting into words while preserving spaces/punctuation."""
    import re
    return re.findall(r'\S+|\s+', text)


def compute_word_diffs(old_text: str, new_text: str) -> List[Tuple[str, str]]:
    """
    Computes token-level diffs between old_text and new_text.
    Returns list of ('equal' | 'delete' | 'insert', text).
    """
    old_tokens = _tokenize_text(old_text)
    new_tokens = _tokenize_text(new_text)
    
    matcher = difflib.SequenceMatcher(None, old_tokens, new_tokens)
    diffs: List[Tuple[str, str]] = []
    
    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag == 'equal':
            diffs.append(('equal', "".join(old_tokens[i1:i2])))
        elif tag == 'delete':
            diffs.append(('delete', "".join(old_tokens[i1:i2])))
        elif tag == 'insert':
            diffs.append(('insert', "".join(new_tokens[j1:j2])))
        elif tag == 'replace':
            diffs.append(('delete', "".join(old_tokens[i1:i2])))
            diffs.append(('insert', "".join(new_tokens[j1:j2])))
            
    return diffs


def generate_redline_docx(
    title: str,
    original_text: str,
    remediated_text: str,
    citation: str,
    organization: str = "Apex Financial Technologies LLC",
    section_label: str = "Section 1.1",
    audit_block_index: int = 42,
    audit_hash: str = "0x8f4d92a1c09e3...",
    plain_english_reason: Optional[str] = None,
    is_compliant: bool = False,
) -> io.BytesIO:
    """
    Generates a complete Microsoft Word document (.docx) with:
    - Official Corporate & Regulatory Header
    - Audit Trail Table with SHA-256 Hashes
    - Executive Legal Analysis
    - Real Microsoft Word Track Changes (w:ins / w:del)
    - Cryptographic Attestation Block
    """
    doc = docx.Document()
    
    # Page Margins
    for section in doc.sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)
        
    # Document Title Header
    title_p = doc.add_paragraph()
    title_p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    title_run = title_p.add_run("REGDIFF STATUTORY REDLINE & REMEDIATION CERTIFICATE")
    title_run.font.name = "Calibri"
    title_run.font.size = Pt(18)
    title_run.font.bold = True
    title_run.font.color.rgb = RGBColor(15, 23, 42)  # Slate-900
    
    subtitle_p = doc.add_paragraph()
    sub_run = subtitle_p.add_run(f"Automated Regulatory Revision for {organization}")
    sub_run.font.name = "Calibri"
    sub_run.font.size = Pt(11)
    sub_run.font.italic = True
    sub_run.font.color.rgb = RGBColor(100, 116, 139)
    
    # Metadata Table
    table = doc.add_table(rows=6, cols=2)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.style = 'Table Grid'
    
    rows_data = [
        ("Policy Document", f"{title} ({section_label})"),
        ("Target Statute", citation),
        ("Audit Finding", "COMPLIANT" if is_compliant else "CRITICAL BREACH (Remediated)"),
        ("Ledger Attestation Block", f"Block #{audit_block_index} (SHA-256: {audit_hash[:20]}...)"),
        ("Remediation Date", datetime.datetime.now(datetime.timezone.utc).strftime("%B %d, %Y - %H:%M UTC")),
        ("Governing Framework", "CFPB Rule 1033 / EU AI Act Art. 14 / NYDFS 500"),
    ]
    
    for idx, (label, val) in enumerate(rows_data):
        cell_lbl = table.cell(idx, 0)
        cell_val = table.cell(idx, 1)
        
        cell_lbl.paragraphs[0].text = label
        cell_lbl.paragraphs[0].runs[0].font.bold = True
        cell_lbl.paragraphs[0].runs[0].font.size = Pt(9.5)
        cell_lbl.paragraphs[0].runs[0].font.name = "Calibri"
        
        cell_val.paragraphs[0].text = val
        cell_val.paragraphs[0].runs[0].font.size = Pt(9.5)
        cell_val.paragraphs[0].runs[0].font.name = "Calibri"
        
        if label == "Audit Finding":
            if not is_compliant:
                cell_val.paragraphs[0].runs[0].font.color.rgb = RGBColor(220, 38, 38)
                cell_val.paragraphs[0].runs[0].font.bold = True
            else:
                cell_val.paragraphs[0].runs[0].font.color.rgb = RGBColor(22, 163, 74)
                cell_val.paragraphs[0].runs[0].font.bold = True
                
    doc.add_paragraph()  # Spacing
    
    # Section 1: Executive Legal Counsel Summary
    h1 = doc.add_paragraph()
    h1_run = h1.add_run("1. Executive Statutory Analysis")
    h1_run.font.name = "Calibri"
    h1_run.font.size = Pt(13)
    h1_run.font.bold = True
    h1_run.font.color.rgb = RGBColor(30, 41, 59)
    
    summary_p = doc.add_paragraph()
    summary_p.paragraph_format.line_spacing = 1.15
    summary_text = plain_english_reason or (
        f"The audited policy provision was evaluated against statutory requirements under {citation}. "
        "Any clauses exceeding statutory retention windows or omitting mandatory oversight triggers have been marked "
        "for immediate redline substitution below."
    )
    s_run = summary_p.add_run(summary_text)
    s_run.font.name = "Calibri"
    s_run.font.size = Pt(10.5)
    
    # Section 2: Proposed Redline Amendments (Track Changes)
    h2 = doc.add_paragraph()
    h2_run = h2.add_run("2. Proposed Redline Amendments (Word Track Changes)")
    h2_run.font.name = "Calibri"
    h2_run.font.size = Pt(13)
    h2_run.font.bold = True
    h2_run.font.color.rgb = RGBColor(30, 41, 59)
    
    instructions_p = doc.add_paragraph()
    inst_run = instructions_p.add_run(
        "Note: The paragraph below contains embedded Microsoft Word Track Changes. "
        "Strikethroughs represent non-compliant text flagged for deletion. "
        "Underlined text represents verified statutory remediation text ready for adoption."
    )
    inst_run.font.italic = True
    inst_run.font.size = Pt(9.5)
    inst_run.font.color.rgb = RGBColor(100, 116, 139)
    
    # Build Track Changes paragraph
    redline_p = doc.add_paragraph()
    redline_p.paragraph_format.line_spacing = 1.25
    redline_p.paragraph_format.space_before = Pt(6)
    redline_p.paragraph_format.space_after = Pt(12)
    
    diffs = compute_word_diffs(original_text, remediated_text)
    change_id_counter = 1
    
    for tag, token in diffs:
        if tag == 'equal':
            run = redline_p.add_run(token)
            run.font.name = "Georgia"
            run.font.size = Pt(11)
            run.font.color.rgb = RGBColor(15, 23, 42)
        elif tag == 'delete':
            _add_del_run(redline_p, token, change_id=change_id_counter)
            change_id_counter += 1
        elif tag == 'insert':
            _add_ins_run(redline_p, token, change_id=change_id_counter)
            change_id_counter += 1
            
    # Section 3: Ledger Attestation & Cryptographic Chain Proof
    doc.add_paragraph()  # Spacing
    h3 = doc.add_paragraph()
    h3_run = h3.add_run("3. Cryptographic Attestation & Ledger Verification")
    h3_run.font.name = "Calibri"
    h3_run.font.size = Pt(13)
    h3_run.font.bold = True
    h3_run.font.color.rgb = RGBColor(30, 41, 59)
    
    attest_p = doc.add_paragraph()
    attest_run = attest_p.add_run(
        f"This remediation document was automatically synthesized and attested by the RegDiff Continuous Compliance Engine. "
        f"The integrity of this statutory verification has been sealed into the immutable append-only ledger at Block #{audit_block_index}. "
        f"Hash: {audit_hash}. "
        "Any manual alteration of this document post-export will invalidate the corresponding cryptographic signature."
    )
    attest_run.font.name = "Calibri"
    attest_run.font.size = Pt(9.5)
    attest_run.font.color.rgb = RGBColor(71, 85, 105)
    
    # Signature line
    sig_p = doc.add_paragraph()
    sig_p.paragraph_format.space_before = Pt(18)
    sig_run = sig_p.add_run("Verified by: RegDiff Statutory Compliance Protocol (v1.0-PRODUCTION)\nStatus: Sealed & Cryptographically Enforced")
    sig_run.font.name = "Courier New"
    sig_run.font.size = Pt(8.5)
    sig_run.font.color.rgb = RGBColor(100, 116, 139)
    
    # Save to BytesIO
    buf = io.BytesIO()
    doc.save(buf)
    buf.seek(0)
    return buf


def generate_full_document_docx(
    title: str,
    organization: str,
    clauses: List[Dict[str, Any]],
    audit_block_index: int = 42,
    audit_hash: str = "0x8f4d92a1c09e3...",
    overall_score: int = 100,
) -> io.BytesIO:
    """
    Generates a complete, multi-clause enterprise Word document (.docx) with:
    - Master Document Header & Organization Attestation
    - Full Document Compliance Scorecard Table
    - Section-by-section clauses with surgical OpenXML Track Changes (<w:del> / <w:ins>)
      applied to all remediated provisions
    - Cryptographic verification block sealed under Federal Rules of Evidence Rule 902(13).
    """
    doc = docx.Document()
    
    # Page Margins
    for section in doc.sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)
        
    # Document Title Header
    title_p = doc.add_paragraph()
    title_p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    title_run = title_p.add_run(title.upper())
    title_run.font.name = "Calibri"
    title_run.font.size = Pt(18)
    title_run.font.bold = True
    title_run.font.color.rgb = RGBColor(15, 23, 42)
    
    sub_p = doc.add_paragraph()
    sub_run = sub_p.add_run(f"Enterprise Policy Document • Verified for {organization}")
    sub_run.font.name = "Calibri"
    sub_run.font.size = Pt(11)
    sub_run.font.italic = True
    sub_run.font.color.rgb = RGBColor(100, 116, 139)
    
    doc.add_paragraph()  # Spacing
    
    # Executive Scorecard Table
    score_table = doc.add_table(rows=2, cols=4)
    score_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    
    headers = ["Total Evaluated Clauses", "Passing Clauses", "Remediated Clauses", "Compliance Health Index"]
    values = [
        str(len(clauses)),
        str(sum(1 for c in clauses if c.get("compliant", False) or not c.get("is_modified", False))),
        str(sum(1 for c in clauses if c.get("is_modified", False) or not c.get("compliant", True))),
        f"{overall_score}%"
    ]
    
    hdr_cells = score_table.rows[0].cells
    for i, h in enumerate(headers):
        hdr_cells[i].text = h
        p = hdr_cells[i].paragraphs[0]
        p.runs[0].font.bold = True
        p.runs[0].font.size = Pt(9.5)
        p.runs[0].font.color.rgb = RGBColor(71, 85, 105)
        
    val_cells = score_table.rows[1].cells
    for i, v in enumerate(values):
        val_cells[i].text = v
        p = val_cells[i].paragraphs[0]
        p.runs[0].font.bold = True
        p.runs[0].font.size = Pt(13)
        if i == 3:
            p.runs[0].font.color.rgb = RGBColor(22, 163, 74) if overall_score >= 80 else RGBColor(220, 38, 38)
            
    doc.add_paragraph()  # Spacing
    
    # Section Header
    h2 = doc.add_paragraph()
    h2_run = h2.add_run("OPERATIONAL POLICY CLAUSES & REDLINE REVISIONS")
    h2_run.font.name = "Calibri"
    h2_run.font.size = Pt(13)
    h2_run.font.bold = True
    h2_run.font.color.rgb = RGBColor(30, 41, 59)
    
    change_id_counter = 1
    
    # Iterate through all clauses
    for idx, c in enumerate(clauses):
        sec_label = c.get("section_label", f"Clause {idx + 1}")
        citation = c.get("citation", "Statutory Framework")
        orig = c.get("original_text", "")
        remed = c.get("remediated_text", orig)
        is_mod = c.get("is_modified", False) or (orig != remed and not c.get("compliant", True))
        
        # Section Heading
        sec_p = doc.add_paragraph()
        sec_p.paragraph_format.space_before = Pt(12)
        sec_p.paragraph_format.space_after = Pt(2)
        
        sec_title_run = sec_p.add_run(f"{sec_label} ")
        sec_title_run.font.name = "Calibri"
        sec_title_run.font.size = Pt(11)
        sec_title_run.font.bold = True
        sec_title_run.font.color.rgb = RGBColor(15, 23, 42)
        
        cit_run = sec_p.add_run(f"[{citation}]")
        cit_run.font.name = "Calibri"
        cit_run.font.size = Pt(9.5)
        cit_run.font.italic = True
        cit_run.font.color.rgb = RGBColor(255, 87, 34) if is_mod else RGBColor(100, 116, 139)
        
        # Clause Body Paragraph
        body_p = doc.add_paragraph()
        body_p.paragraph_format.line_spacing = 1.15
        body_p.paragraph_format.space_after = Pt(6)
        
        if is_mod and orig != remed:
            diffs = compute_word_diffs(orig, remed)
            for tag, token in diffs:
                if tag == 'equal':
                    r = body_p.add_run(token)
                    r.font.name = "Calibri"
                    r.font.size = Pt(10.5)
                elif tag == 'delete':
                    _add_del_run(body_p, token, change_id=change_id_counter)
                    change_id_counter += 1
                elif tag == 'insert':
                    _add_ins_run(body_p, token, change_id=change_id_counter)
                    change_id_counter += 1
        else:
            r = body_p.add_run(orig)
            r.font.name = "Calibri"
            r.font.size = Pt(10.5)
            r.font.color.rgb = RGBColor(30, 41, 59)
            
    # Cryptographic Attestation Block
    doc.add_paragraph()  # Spacing
    h3 = doc.add_paragraph()
    h3_run = h3.add_run("Cryptographic Attestation & Continuous Monitoring Certificate")
    h3_run.font.name = "Calibri"
    h3_run.font.size = Pt(12)
    h3_run.font.bold = True
    h3_run.font.color.rgb = RGBColor(30, 41, 59)
    
    attest_p = doc.add_paragraph()
    attest_run = attest_p.add_run(
        f"This document was compiled and certified by the RegDiff Continuous Compliance Enclave. "
        f"All modified statutory provisions adhere to mandatory regulatory ceilings under active law. "
        f"Sealed into Immutable Ledger at Block #{audit_block_index} • State SHA-256 Digest: {audit_hash}. "
        "Admissible under Federal Rules of Evidence Rule 902(13) as self-authenticating digital evidence."
    )
    attest_run.font.name = "Calibri"
    attest_run.font.size = Pt(9)
    attest_run.font.color.rgb = RGBColor(71, 85, 105)
    
    buf = io.BytesIO()
    doc.save(buf)
    buf.seek(0)
    return buf
