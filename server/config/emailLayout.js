
const BRAND = {
  ink: '#0d0d0d',        
  red: '#B90808',        
  paper: '#ffffff',
  text: '#1a1a1a',
  muted: '#8a8a8a',
  border: '#e6e6e6',
};

export const wrapEmail = ({ body, logoUrl, platformName = 'Luvenex', footerNote = '' }) => {
  const logoBlock = logoUrl
    ? `<img src="${logoUrl}" alt="${platformName}" width="140" style="display:block;border:0;max-width:140px;height:auto;" />`
    : `<span style="font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:26px;font-weight:700;color:${BRAND.paper};letter-spacing:0.5px;">${platformName}</span>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${platformName}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f5;padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:${BRAND.paper};border-radius:12px;overflow:hidden;border:1px solid ${BRAND.border};">

          <!-- Header -->
          <tr>
            <td align="center" style="background:${BRAND.ink};padding:26px 24px;">
              ${logoBlock}
            </td>
          </tr>

          <!-- Red rule under the header -->
          <tr><td style="height:3px;background:${BRAND.red};line-height:3px;font-size:0;">&nbsp;</td></tr>

          <!-- Content -->
          <tr>
            <td style="padding:32px 32px 28px;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.65;color:${BRAND.text};">
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:${BRAND.ink};padding:22px 32px;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
              <p style="margin:0 0 6px;font-size:12px;color:${BRAND.paper};font-weight:600;">${platformName}</p>
              <p style="margin:0;font-size:11px;line-height:1.6;color:${BRAND.muted};">
                ${footerNote || 'You received this because of activity on your account.'}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};


export const styleBodyHtml = (html) =>
  String(html || '')
    .replace(/<p>/g, `<p style="margin:0 0 14px;">`)
    .replace(/<a /g, `<a style="color:${BRAND.red};text-decoration:underline;" `)
    .replace(/<strong>/g, `<strong style="font-weight:600;color:${BRAND.ink};">`)
    .replace(/<h([1-3])>/g, (_, n) =>
      `<h${n} style="margin:0 0 12px;font-size:${[22, 19, 17][n - 1]}px;color:${BRAND.ink};">`
    );

export { BRAND };