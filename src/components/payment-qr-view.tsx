import { View } from "react-native";
import QRCode from "react-native-qrcode-svg";

// The redrawn QR Ph code. Black on white so wallet apps can scan it (the only raw colors outside Palette A).
export function PaymentQrView({ qr }: { qr: string }) {
  return (
    <View className="items-center rounded-lg border border-border bg-white p-4">
      <QRCode value={qr} size={280} color="black" backgroundColor="white" />
    </View>
  );
}
