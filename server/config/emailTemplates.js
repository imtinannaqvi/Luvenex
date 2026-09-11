

export const TEMPLATE_DEFS = {
  deal_completed: {
    name: 'Deal completed',
    description: 'Sent to both sides when a deal is marked complete.',
    vars: [
      { key: 'userName', label: 'Recipient name', sample: 'Sara Khan' },
      { key: 'dealTitle', label: 'Deal title', sample: 'Summer skincare campaign' },
      { key: 'amount', label: 'Deal amount', sample: 'PKR 45,000' },
      { key: 'otherParty', label: 'Other party name', sample: 'Glow Cosmetics' },
      { key: 'dealUrl', label: 'Link to the deal', sample: 'https://luvenex.com/app/deals/123' },
    ],
    defaultSubject: 'Your deal "{{dealTitle}}" is complete',
    defaultBody: `<p>Hi {{userName}},</p>
<p>Your deal <strong>{{dealTitle}}</strong> with {{otherParty}} has been marked complete.</p>
<p>Amount: <strong>{{amount}}</strong></p>
<p><a href="{{dealUrl}}">View the deal</a></p>
<p>Thanks for using Luvenex.</p>`,
  },

  gig_completed: {
    name: 'Gig completed',
    description: 'Sent to the creator when a gig order is finished.',
    vars: [
      { key: 'userName', label: 'Recipient name', sample: 'Sara Khan' },
      { key: 'gigTitle', label: 'Gig title', sample: 'Instagram reel + story set' },
      { key: 'amount', label: 'Payout amount', sample: 'PKR 18,500' },
      { key: 'buyerName', label: 'Buyer name', sample: 'Glow Cosmetics' },
      { key: 'gigUrl', label: 'Link to the gig', sample: 'https://luvenex.com/app/gigs/456' },
    ],
    defaultSubject: 'Gig completed — {{gigTitle}}',
    defaultBody: `<p>Hi {{userName}},</p>
<p>Nice work. <strong>{{gigTitle}}</strong> has been completed for {{buyerName}}.</p>
<p><strong>{{amount}}</strong> will be released to your wallet.</p>
<p><a href="{{gigUrl}}">View the gig</a></p>`,
  },

  verification_approved: {
    name: 'Verification approved',
    description: 'Sent when an admin approves a verification request.',
    vars: [
      { key: 'userName', label: 'Recipient name', sample: 'Sara Khan' },
      { key: 'profileUrl', label: 'Link to profile', sample: 'https://luvenex.com/creator/sara' },
    ],
    defaultSubject: "You're verified on Luvenex",
    defaultBody: `<p>Hi {{userName}},</p>
<p>Your verification request has been approved. The verified badge is now on your profile.</p>
<p><a href="{{profileUrl}}">View your profile</a></p>`,
  },

  verification_rejected: {
    name: 'Verification declined',
    description: 'Sent when an admin declines a verification request.',
    vars: [
      { key: 'userName', label: 'Recipient name', sample: 'Sara Khan' },
      { key: 'reason', label: 'Reason given', sample: 'Profile is missing a profile photo.' },
    ],
    defaultSubject: 'About your verification request',
    defaultBody: `<p>Hi {{userName}},</p>
<p>We reviewed your verification request and can't approve it yet.</p>
<p><em>{{reason}}</em></p>
<p>You're welcome to apply again once that's sorted.</p>`,
  },

  payout_approved: {
    name: 'Payout approved',
    description: 'Sent when a withdrawal request is approved.',
    vars: [
      { key: 'userName', label: 'Recipient name', sample: 'Sara Khan' },
      { key: 'amount', label: 'Payout amount', sample: 'PKR 32,000' },
      { key: 'method', label: 'Payout method', sample: 'Bank transfer' },
    ],
    defaultSubject: 'Your payout of {{amount}} is on its way',
    defaultBody: `<p>Hi {{userName}},</p>
<p>Your withdrawal of <strong>{{amount}}</strong> has been approved and sent via {{method}}.</p>
<p>It usually lands within 1–3 working days.</p>`,
  },
};

export const TEMPLATE_KEYS = Object.keys(TEMPLATE_DEFS);

/** Swaps {{placeholders}} for real values. Unknown keys become empty strings. */
export const renderTemplate = (str, data = {}) =>
  String(str || '').replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => data[key] ?? '');