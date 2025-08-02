export async function shareViaWhatsApp(
  file?: Blob | null, 
  fileName?: string, 
  phoneNumber?: string, 
  message?: string
): Promise<boolean> {
  try {
    // For file sharing, always download first, then use WhatsApp URL
    if (file && fileName) {
      // Download the file
      const url = URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Then open WhatsApp if phone number provided
      if (phoneNumber) {
        setTimeout(() => {
          const cleanPhone = phoneNumber.replace(/[^\d]/g, '');
          const whatsappMessage = encodeURIComponent(message || "Documento anexado. Por favor, envie o arquivo baixado.");
          const whatsappUrl = `https://wa.me/${cleanPhone}?text=${whatsappMessage}`;
          window.open(whatsappUrl, "_blank");
        }, 1000);
      }
      
      return true;
    }

    // For text-only sharing
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