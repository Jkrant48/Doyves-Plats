import { useEffect } from "react";

export default function LanguageSelector() {
  useEffect(() => {
    function initializeGoogleTranslate() {
      const container = document.getElementById("google_translate_element");
      const TranslateElement = window.google?.translate?.TranslateElement;

      if (
        !container ||
        !TranslateElement ||
        container.querySelector("select")
      ) {
        return;
      }

      new TranslateElement(
        {
          pageLanguage: "en",
          includedLanguages: "en,fi,da",
          layout: TranslateElement.InlineLayout.SIMPLE,
        },
        "google_translate_element",
      );
    }

    window.googleTranslateElementInit = initializeGoogleTranslate;

    if (window.google?.translate?.TranslateElement) {
      initializeGoogleTranslate();
      return;
    }

    if (!document.getElementById("google-translate-script")) {
      const script = document.createElement("script");
      script.id = "google-translate-script";
      script.src =
        "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  return (
    <div className="language-selector">
      <div id="google_translate_element"></div>
    </div>
  );
}
