interface InteractionBannerProps {
  matchedDrugs: string[];
}

export default function InteractionBanner({ matchedDrugs }: InteractionBannerProps) {
  return (
    <div className="interaction-banner" role="alert">
      <strong>⚠ Etkileşim Uyarısı</strong>
      <p>
        Sorunuz {matchedDrugs.join(" ve ")} ilaçlarını birlikte içeriyor. Aşağıdaki cevabı
        dikkatle okuyun ve kesin bilgi için eczacınıza veya doktorunuza danışın.
      </p>
    </div>
  );
}
