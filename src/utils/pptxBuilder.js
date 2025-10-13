const UTF8_ENCODER = new TextEncoder();

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let j = 0; j < 8; j += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

const crc32 = (bytes) => {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
};

const toUint8 = (input) => {
  if (input instanceof Uint8Array) {
    return input;
  }
  return UTF8_ENCODER.encode(input);
};

const xmlEscape = (value) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const buildSlideXml = (slide, index) => {
  const textItems = slide.content
    .filter((item) => item?.type === 'text' && item.text)
    .map((item) => item.text.trim())
    .filter(Boolean);

  const paragraphs = (textItems.length ? textItems : [`Slide ${index + 1}`])
    .map((text) => {
      const safe = xmlEscape(text);
      return `      <a:p>
        <a:r>
          <a:rPr lang="en-US"/>
          <a:t>${safe}</a:t>
        </a:r>
        <a:endParaRPr lang="en-US"/>
      </a:p>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
 xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr>
        <p:cNvPr id="1" name=""/>
        <p:cNvGrpSpPr/>
        <p:nvPr/>
      </p:nvGrpSpPr>
      <p:grpSpPr>
        <a:xfrm>
          <a:off x="0" y="0"/>
          <a:ext cx="0" cy="0"/>
          <a:chOff x="0" y="0"/>
          <a:chExt cx="0" cy="0"/>
        </a:xfrm>
      </p:grpSpPr>
      <p:sp>
        <p:nvSpPr>
          <p:cNvPr id="2" name="TextBox ${index + 1}"/>
          <p:cNvSpPr txBox="1"/>
          <p:nvPr/>
        </p:nvSpPr>
        <p:spPr>
          <a:xfrm>
            <a:off x="457200" y="457200"/>
            <a:ext cx="8229600" cy="5486400"/>
          </a:xfrm>
          <a:prstGeom prst="rect">
            <a:avLst/>
          </a:prstGeom>
        </p:spPr>
        <p:txBody>
          <a:bodyPr wrap="square"/>
          <a:lstStyle/>
${paragraphs}
        </p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr>
    <a:masterClrMapping/>
  </p:clrMapOvr>
</p:sld>`;
};

const buildContentTypesXml = (slideCount) => {
  const slideOverrides = Array.from({ length: slideCount }, (_, i) => {
    const index = i + 1;
    return `  <Override PartName="/ppt/slides/slide${index}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
${slideOverrides}
</Types>`;
};

const buildPresentationXml = (slideCount) => {
  const slideEntries = Array.from({ length: slideCount }, (_, i) => {
    const idx = i + 1;
    return `    <p:sldId id="${256 + i}" r:id="rId${idx}"/>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
 xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldIdLst>
${slideEntries}
  </p:sldIdLst>
  <p:sldSz cx="9144000" cy="6858000" type="screen4x3"/>
  <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>`;
};

const buildPresentationRelsXml = (slideCount) => {
  const rels = Array.from({ length: slideCount }, (_, i) => {
    const idx = i + 1;
    return `  <Relationship Id="rId${idx}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${idx}.xml"/>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${rels}
  <Relationship Id="rId${slideCount + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>
</Relationships>`;
};

const coreXml = () => {
  const now = new Date().toISOString();
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"
 xmlns:dc="http://purl.org/dc/elements/1.1/"
 xmlns:dcterms="http://purl.org/dc/terms/"
 xmlns:dcmitype="http://purl.org/dc/dcmitype/"
 xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>Generated Presentation</dc:title>
  <dc:creator>pptts</dc:creator>
  <cp:lastModifiedBy>pptts</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified>
</cp:coreProperties>`;
};

const appXml = (slideCount) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"
 xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>pptts</Application>
  <Slides>${slideCount}</Slides>
  <Notes>0</Notes>
  <PresentationFormat>Custom</PresentationFormat>
</Properties>`;

const themeXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Office Theme">
  <a:themeElements>
    <a:clrScheme name="Office">
      <a:dk1><a:srgbClr val="000000"/></a:dk1>
      <a:lt1><a:srgbClr val="FFFFFF"/></a:lt1>
      <a:dk2><a:srgbClr val="1F497D"/></a:dk2>
      <a:lt2><a:srgbClr val="EEECE1"/></a:lt2>
      <a:accent1><a:srgbClr val="4F81BD"/></a:accent1>
      <a:accent2><a:srgbClr val="C0504D"/></a:accent2>
      <a:accent3><a:srgbClr val="9BBB59"/></a:accent3>
      <a:accent4><a:srgbClr val="8064A2"/></a:accent4>
      <a:accent5><a:srgbClr val="4BACC6"/></a:accent5>
      <a:accent6><a:srgbClr val="F79646"/></a:accent6>
      <a:hlink><a:srgbClr val="0000FF"/></a:hlink>
      <a:folHlink><a:srgbClr val="800080"/></a:folHlink>
    </a:clrScheme>
    <a:fontScheme name="Office">
      <a:majorFont>
        <a:latin typeface="Calibri"/>
        <a:ea typeface=""/>
        <a:cs typeface=""/>
      </a:majorFont>
      <a:minorFont>
        <a:latin typeface="Calibri"/>
        <a:ea typeface=""/>
        <a:cs typeface=""/>
      </a:minorFont>
    </a:fontScheme>
    <a:fmtScheme name="Office">
      <a:fillStyleLst>
        <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
      </a:fillStyleLst>
      <a:lnStyleLst>
        <a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln>
      </a:lnStyleLst>
      <a:effectStyleLst>
        <a:effectStyle><a:effectLst/></a:effectStyle>
      </a:effectStyleLst>
      <a:bgFillStyleLst>
        <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
      </a:bgFillStyleLst>
    </a:fmtScheme>
  </a:themeElements>
</a:theme>`;

const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;

const buildZip = (entries) => {
  let offset = 0;
  const chunks = [];
  const centralDirectory = [];

  const writeUint16 = (view, pos, value) => {
    view.setUint16(pos, value, true);
  };
  const writeUint32 = (view, pos, value) => {
    view.setUint32(pos, value, true);
  };

  entries.forEach(({ name, data }) => {
    const fileData = toUint8(data);
    const nameBytes = toUint8(name);
    const crc = crc32(fileData);
    const compressedSize = fileData.length;
    const uncompressedSize = fileData.length;
    const localHeader = new ArrayBuffer(30);
    const localView = new DataView(localHeader);
    writeUint32(localView, 0, 0x04034b50);
    writeUint16(localView, 4, 20);
    writeUint16(localView, 6, 0);
    writeUint16(localView, 8, 0); // stored, no compression
    writeUint16(localView, 10, 0);
    writeUint16(localView, 12, 0);
    writeUint32(localView, 14, crc);
    writeUint32(localView, 18, compressedSize);
    writeUint32(localView, 22, uncompressedSize);
    writeUint16(localView, 26, nameBytes.length);
    writeUint16(localView, 28, 0);

    chunks.push(new Uint8Array(localHeader));
    chunks.push(nameBytes);
    chunks.push(fileData);

    const centralHeader = new ArrayBuffer(46);
    const centralView = new DataView(centralHeader);
    writeUint32(centralView, 0, 0x02014b50);
    writeUint16(centralView, 4, 20);
    writeUint16(centralView, 6, 20);
    writeUint16(centralView, 8, 0);
    writeUint16(centralView, 10, 0);
    writeUint16(centralView, 12, 0);
    writeUint16(centralView, 14, 0);
    writeUint16(centralView, 16, 0);
    writeUint32(centralView, 18, crc);
    writeUint32(centralView, 22, compressedSize);
    writeUint32(centralView, 26, uncompressedSize);
    writeUint16(centralView, 30, nameBytes.length);
    writeUint16(centralView, 32, 0);
    writeUint16(centralView, 34, 0);
    writeUint16(centralView, 36, 0);
    writeUint16(centralView, 38, 0);
    writeUint32(centralView, 40, 0);
    writeUint32(centralView, 42, offset);

    centralDirectory.push(new Uint8Array(centralHeader));
    centralDirectory.push(nameBytes);

    offset += 30 + nameBytes.length + fileData.length;
  });

  const centralSize = centralDirectory.reduce((sum, part) => sum + part.length, 0);
  const endHeader = new ArrayBuffer(22);
  const endView = new DataView(endHeader);
  writeUint32(endView, 0, 0x06054b50);
  writeUint16(endView, 4, 0);
  writeUint16(endView, 6, 0);
  writeUint16(endView, 8, entries.length);
  writeUint16(endView, 10, entries.length);
  writeUint32(endView, 12, centralSize);
  writeUint32(endView, 16, offset);
  writeUint16(endView, 20, 0);

  return new Blob([...chunks, ...centralDirectory, new Uint8Array(endHeader)], {
    type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  });
};

export const createPptx = (slides) => {
  const slideCount = slides.length || 1;
  const entries = [
    { name: '[Content_Types].xml', data: buildContentTypesXml(slideCount) },
    { name: '_rels/.rels', data: rootRelsXml },
    { name: 'docProps/app.xml', data: appXml(slideCount) },
    { name: 'docProps/core.xml', data: coreXml() },
    { name: 'ppt/presentation.xml', data: buildPresentationXml(slideCount) },
    { name: 'ppt/_rels/presentation.xml.rels', data: buildPresentationRelsXml(slideCount) },
    { name: 'ppt/theme/theme1.xml', data: themeXml }
  ];

  slides.forEach((slide, index) => {
    entries.push({
      name: `ppt/slides/slide${index + 1}.xml`,
      data: buildSlideXml(slide, index)
    });
  });

  return buildZip(entries);
};
