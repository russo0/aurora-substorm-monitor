import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      "Aurora Substorm Monitor": "Aurora Substorm Monitor",
      "BZ": "BZ (IMF)",
      "Solar Wind": "Solar Wind",
      "Kp Index": "Kp Index",
      "Chance of Substorm": "Chance of Substorm",
      "High": "High",
      "Moderate": "Moderate",
      "Low": "Low",
      "Last 6h": "Last 6h",
      "ALERT!": "ALERT!",
      "Alert! High chance of substorm!": "Alert! High chance of substorm!",
      "Switch Language": "Switch Language",
      "Data Mode": "Data Mode",
      "Demo": "Demo",
      "Live": "Live",
      "Last update": "Last update",
    }
  },
  pt: {
    translation: {
      "Aurora Substorm Monitor": "Monitor de Subtempestade de Aurora",
      "BZ": "BZ (IMF)",
      "Solar Wind": "Vento Solar",
      "Kp Index": "Índice Kp",
      "Chance of Substorm": "Chance de Subtempestade",
      "High": "Alta",
      "Moderate": "Moderada",
      "Low": "Baixa",
      "Last 6h": "Últimas 6h",
      "ALERT!": "ALERTA!",
      "Alert! High chance of substorm!": "Alerta! Alta chance de subtempestade!",
      "Switch Language": "Trocar idioma",
      "Data Mode": "Modo de Dados",
      "Demo": "Demo",
      "Live": "Ao Vivo",
      "Last update": "Última atualização",
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en",
    fallbackLng: "en",
    interpolation: { escapeValue: false }
  });

export default i18n;
