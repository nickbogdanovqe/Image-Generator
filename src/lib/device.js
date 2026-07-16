/** iPhone 16 Pro Max logical (CSS point) dimensions and native screenshot scale */
export const IPHONE_16_PRO_MAX = {
  width: 440,
  height: 956,
  scale: 3,
  get pixelWidth() {
    return this.width * this.scale
  },
  get pixelHeight() {
    return this.height * this.scale
  },
}
