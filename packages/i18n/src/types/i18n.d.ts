import "i18next";

// Import translation files
import type common from "../locales/en/common.json";
import type home from "../locales/en/home.json";
import type orders from "../locales/en/orders.json";
import type suppliers from "../locales/en/suppliers.json";
import type reports from "../locales/en/reports.json";
import type settings from "../locales/en/settings.json";
import type validation from "../locales/en/validation.json";
import type onboarding from "../locales/en/onboarding.json";
import type inventory from "../locales/en/inventory.json";
import type login from "../locales/en/login.json";
import type manufacturer from "../locales/en/manufacturer.json";
import type stockAdjustments from "../locales/en/stock-adjustments.json";
import type itemInquiry from "../locales/en/item-inquiry.json";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "common";
    resources: {
      common: typeof common;
      home: typeof home;
      orders: typeof orders;
      suppliers: typeof suppliers;
      reports: typeof reports;
      settings: typeof settings;
      validation: typeof validation;
      onboarding: typeof onboarding;
      inventory: typeof inventory;
      login: typeof login;
      manufacturer: typeof manufacturer;
      "stock-adjustments": typeof stockAdjustments;
      "item-inquiry": typeof itemInquiry;
    };
    returnNull: false;
  }
}
