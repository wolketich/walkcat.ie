"""Build the three-page rate card and share image from the page's shared offers."""
import json
import shutil
from pathlib import Path
from xml.sax.saxutils import escape

from PIL import Image, ImageDraw, ImageFont
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'src/vladislav'
OUT = ROOT / 'output/pdf'
OUT.mkdir(parents=True, exist_ok=True)
DATA = json.loads((SOURCE / 'services.json').read_text())
FONTS = SOURCE / 'fonts'
for name, filename in [('Body', 'dm-sans.ttf'), ('Medium', 'dm-sans-medium.ttf'),
                       ('Display', 'instrument-serif.ttf'), ('Italic', 'instrument-serif-italic.ttf')]:
    pdfmetrics.registerFont(TTFont(name, str(FONTS / filename)))
pdfmetrics.registerFontFamily('Body', normal='Body', bold='Medium', italic='Body', boldItalic='Medium')

PAPER, INK, MUTED, GREEN, LINE = '#f7f6f0', '#242b23', '#61665d', '#344b36', '#d6d9cc'
W, H = 595.2756, 841.8898
M = 44
PDF = OUT / 'vladislav-cernega-rate-card.pdf'
C = canvas.Canvas(str(PDF), pagesize=(W, H))
C.setTitle('Vladislav Cernega | Services & Rate Card')
C.setAuthor(DATA['name'])
C.setSubject('Website, marketing and creative services - October 2026')

def euros(value):
    return f'€{value:,}'

def rect(x, y, width, height, color):
    C.setFillColor(HexColor(color))
    C.rect(x, H-y-height, width, height, fill=1, stroke=0)

def line(x1, y, x2, color=LINE):
    C.setStrokeColor(HexColor(color))
    C.setLineWidth(.55)
    C.line(x1, H-y, x2, H-y)

def text(value, x, top, size=10, font='Body', color=INK):
    C.setFillColor(HexColor(color))
    C.setFont(font, size)
    C.drawString(x, H-top-size, value)

def para(value, x, top, width, size=9, color=MUTED, leading=None):
    style = ParagraphStyle('body', fontName='Body', fontSize=size,
                           leading=leading or size*1.55, textColor=HexColor(color))
    block = Paragraph(escape(value), style)
    _, height = block.wrap(width, H)
    block.drawOn(C, x, H-top-height)
    return height

def footer(page):
    line(M, 789, W-M)
    text(DATA['name'], M, 802, 8, 'Medium')
    text(DATA['edition'] + ' / EUR', 246, 802, 7, color=MUTED)
    text(f'0{page} / 03', W-M-35, 802, 7, color=MUTED)

def base(page, category):
    rect(0, 0, W, H, PAPER)
    text('Vladislav Cernega', M, 29, 21, 'Display')
    text('SERVICES & RATE CARD', W-M-117, 35, 7.5, 'Medium')
    line(M, 66, W-M)
    text(category, M, 88, 8, 'Medium', GREEN)
    footer(page)

base(1, '01 / WEBSITES')
text('A proper home', M, 108, 44, 'Display')
text('for your business.', M, 153, 44, 'Italic', GREEN)
para('Thoughtful websites for Irish small businesses. Work directly with me, from the first conversation to the final details.', M, 214, 425, 10)

for i, item in enumerate(DATA['websites']):
    y = 267+i*123
    if i == 1:
        rect(M-12, y-9, W-2*M+24, 123, '#e6eadd')
    line(M, y, W-M)
    text(f'0{i+1}', M, y+13, 8, 'Medium', GREEN)
    text(item['name'], M+29, y+10, 24, 'Display')
    text(item['tagline'], M+29, y+41, 9, color=MUTED)
    para(item['scope'], M+29, y+64, 293, 9)
    text('FROM', W-M-97, y+13, 7, color=MUTED)
    text(euros(item['price']), W-M-97, y+27, 32, 'Display')
    text('one-time project', W-M-97, y+68, 7, color=MUTED)

care = DATA['services'][0]
rect(M, 652, W-2*M, 71, GREEN)
text('Website care', M+16, 663, 21, 'Display', PAPER)
text('From '+euros(care['price'])+'/month', W-M-125, 670, 11, 'Medium', PAPER)
para(care['scope'], M+16, 693, W-2*M-32, 8, PAPER, 11)
para(DATA['pricingNote']+' '+DATA['vat'], M, 737, W-2*M, 8, MUTED, 12)
C.showPage()

base(2, '02 / MARKETING & CREATIVE')
text('Get seen. Stay remembered.', M, 108, 40, 'Display')
para('Choose the support your business needs next. Each service can be commissioned on its own.', M, 168, 415, 10)

y = 218
for item in DATA['services'][1:]:
    line(M, y, W-M)
    text(item['name'], M, y+10, 15, 'Medium')
    description_height = para(item['scope'], M, y+34, 335, 8.5, leading=12)
    text('From '+euros(item['price']), W-M-116, y+10, 20, 'Display')
    text('/ '+item['unit'], W-M-116, y+36, 8, color=MUTED)
    if item.get('setup'):
        text('+ '+euros(item['setup'])+' setup', W-M-116, y+49, 8, color=MUTED)
    y += max(64, 34+description_height+12)

if y > 747:
    raise ValueError(f'Marketing rows exceed their page area: {y}')
para('Ad spend and third-party costs are separate. '+DATA['vat'], M, 755, W-2*M, 8, leading=11)
C.showPage()

base(3, '03 / THE DETAILS')
text('Good work starts', M, 108, 44, 'Display')
text('with a clear plan.', M, 153, 44, 'Italic', GREEN)

y = 221
for number, heading, body in [
    ('01', 'Tell me what you need.', 'Share your business, your goals and any ideas you already have.'),
    ('02', 'Agree the details.', 'Receive a clear scope, price and timeline before work begins.'),
    ('03', 'Create, review, hand over.', 'We refine the work together and prepare it for launch or delivery.')]:
    text(number, M, y+2, 8, 'Medium', GREEN)
    text(heading, M+29, y, 13, 'Medium')
    para(body, M+29, y+21, W-2*M-29, 9)
    y += 62

line(M, 414, W-M)
text('A few useful details', M, 430, 24, 'Display')
y = 472
for index, term in enumerate(DATA['terms']):
    text('+', M, y, 10, 'Medium', GREEN)
    used = para(term, M+16, y, W-2*M-16, 8.5, leading=12.5)
    y += used+10
para(DATA['pricingNote']+' '+DATA['vat'], M, y+2, W-2*M, 8, leading=11)
if y+26 > 676:
    raise ValueError(f'Terms exceed their page area: {y}')

rect(M, 691, W-2*M, 80, GREEN)
text('Let’s discuss your project.', M+17, 701, 25, 'Display', PAPER)
text(DATA['email'], M+17, 739, 11, 'Medium', PAPER)
C.linkURL('mailto:'+DATA['email']+'?subject=Let%27s%20discuss%20a%20project',
          (M+17, H-758, M+215, H-735), relative=0)
C.save()
shutil.copyfile(PDF, ROOT/'vladislav'/PDF.name)

# A self-hosted, raster social preview with the same typography as the page.
share = Image.new('RGB', (1200, 630), PAPER)
draw = ImageDraw.Draw(share)
font = lambda file, size: ImageFont.truetype(str(FONTS/file), size)
draw.rectangle((855, 0, 1200, 630), fill=GREEN)
draw.text((65, 48), DATA['name'], fill=INK, font=font('instrument-serif.ttf', 40))
draw.line((65, 115, 794, 115), fill=LINE, width=2)
draw.text((65, 163), 'Websites,', fill=INK, font=font('instrument-serif.ttf', 95))
draw.text((65, 259), 'marketing & design.', fill=GREEN, font=font('instrument-serif-italic.ttf', 95))
draw.text((65, 380), 'For the business you’re building.', fill=MUTED, font=font('dm-sans.ttf', 25))
draw.text((65, 528), 'DUBLIN, IRELAND  /  WEBSITES FROM '+euros(DATA['websites'][0]['price']), fill=GREEN, font=font('dm-sans-medium.ttf', 17))
draw.text((893, 195), 'vc.', fill=PAPER, font=font('instrument-serif.ttf', 212))
share.save(ROOT/'vladislav/media/share.jpg', quality=90)
print(f'Created {PDF.relative_to(ROOT)}')
