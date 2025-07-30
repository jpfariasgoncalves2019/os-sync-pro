export async function shareViaWhatsApp(
  file?: Blob | null, 
  fileName?: string, 
  phoneNumber?: string, 
  message?: string
): Promise<boolean> {
  try {
    // Check if Web Share API is available
    if (navigator.share) {
      const shareData: ShareData = {};

      if (message) {
        shareData.text = message;
      }

      if (file && fileName) {
        const fileToShare = new File([file], fileName, { type: file.type });
        shareData.files = [fileToShare];
      }

      // Try to share with WhatsApp preference
      await navigator.share(shareData);
      return true;
    }

    // Fallback: Direct WhatsApp URL
    if (phoneNumber) {
      const cleanPhone = phoneNumber.replace(/[^\d]/g, '');
      const whatsappMessage = encodeURIComponent(message || "");
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${whatsappMessage}`;
      
      window.open(whatsappUrl, "_blank");
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error sharing via WhatsApp:", error);
    return false;
  }
}

// Check if WhatsApp is likely installed (mobile detection)
export function isWhatsAppLikelyAvailable(): boolean {
  return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}