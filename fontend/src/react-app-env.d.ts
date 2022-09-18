/// <reference types="react-scripts" />
declare module '*.mp3' {
    const src: string;
    export default src;
  }

  declare module "react-dom/client" {
    // typing module default export as `any` will allow you to access its members without compiler warning
    var createRoot: any;
    export {createRoot};
  }