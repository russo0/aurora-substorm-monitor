import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      "Monitor de Aurora": "Aurora Monitor",
      "Trocar idioma": "Switch Language",
      "BZ (IMF)": "BZ (IMF)",
      "Vento Solar": "Solar Wind",
      "Índice Kp": "Kp Index",
      "Índice Bt": "Bt Index",	
      "ALERTA!": "ALERT!",
      "Alerta! Alta chance de subtempestade!": "Alert! High chance of substorm!",
      "Chance de Subtempestade": "Chance of Substorm",
      "Alta": "High",
      "Moderada": "Moderate",
      "Baixa": "Low",
      "Última atualização": "Last update",
      "Atualizar agora": "Update now"
    }
  },
  pt: {
    translation: {
      "Monitor de Aurora": "Monitor de Aurora",
      "Trocar idioma": "Trocar idioma",
      "BZ (IMF)": "BZ (IMF)",
      "Vento Solar": "Vento Solar",
      "Índice Kp": "Índice Kp",
      "Índice Bt": "Índice Bt",
      "ALERTA!": "ALERTA!",
      "Alerta! Alta chance de subtempestade!": "Alerta! Alta chance de subtempestade!",
      "Chance de Subtempestade": "Chance de Subtempestade",
      "Alta": "Alta",
      "Moderada": "Moderada",
      "Baixa": "Baixa",
      "Última atualização": "Última atualização",
      "Atualizar agora": "Atualizar agora"
    }
  }
};

i18n.use(initReactI18next).init({
  resources,
  lng: "pt",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false
  }
});

export default i18n;
