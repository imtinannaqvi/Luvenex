import PlatformSettings from "../models/PlatformSettings.js";



export const computeFees = async (priceMinor) => {
  const settings = await PlatformSettings.getSettings();
  // console.log("FEE DEBUG →", {
  //   priceMinor,
  //   brandFeePercent: settings.brandFeePercent,
  //   influencerFeePercent: settings.influencerFeePercent,
  // });
  const brandFeeMinor = Math.round(priceMinor * (settings.brandFeePercent / 100));
  const influencerFeeMinor = Math.round(priceMinor * (settings.influencerFeePercent / 100));
  const commissionMinor = brandFeeMinor + influencerFeeMinor;
  return { brandFeeMinor, influencerFeeMinor, commissionMinor };
};

export const formatPKR = (minor) =>
  `PKR ${(minor / 100).toLocaleString('en-PK')}`;