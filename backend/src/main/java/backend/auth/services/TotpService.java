package backend.auth.services;

import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Locale;

@Service
public class TotpService {

    private static final String HMAC_ALGORITHM = "HmacSHA1";
    private static final String BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    private static final int SECRET_BYTES = 20;
    private static final int DIGITS = 6;
    private static final int PERIOD_SECONDS = 30;
    private static final int VALIDATION_WINDOW = 1;

    private final SecureRandom secureRandom = new SecureRandom();

    public String generateSecret() {
        byte[] buffer = new byte[SECRET_BYTES];
        secureRandom.nextBytes(buffer);
        return base32Encode(buffer);
    }

    public String buildOtpAuthUri(String issuer, String accountName, String secret) {
        String safeIssuer = issuer == null || issuer.isBlank() ? "NEXUS" : issuer.trim();
        String safeAccount = accountName == null || accountName.isBlank() ? "user" : accountName.trim();

        String label = urlEncode(safeIssuer + ":" + safeAccount);
        return "otpauth://totp/" + label
                + "?secret=" + urlEncode(secret)
                + "&issuer=" + urlEncode(safeIssuer)
                + "&algorithm=SHA1&digits=" + DIGITS + "&period=" + PERIOD_SECONDS;
    }

    public boolean isCodeValid(String base32Secret, String code) {
        if (base32Secret == null || base32Secret.isBlank() || code == null) {
            return false;
        }

        String normalizedCode = code.replaceAll("\\s", "");
        if (!normalizedCode.matches("\\d{6}")) {
            return false;
        }

        byte[] secret;
        try {
            secret = base32Decode(base32Secret);
        } catch (IllegalArgumentException ex) {
            return false;
        }

        long currentCounter = Instant.now().getEpochSecond() / PERIOD_SECONDS;
        for (long offset = -VALIDATION_WINDOW; offset <= VALIDATION_WINDOW; offset++) {
            String expected = generateCode(secret, currentCounter + offset);
            if (expected.equals(normalizedCode)) {
                return true;
            }
        }
        return false;
    }

    private String generateCode(byte[] secret, long counter) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(secret, HMAC_ALGORITHM));
            byte[] hash = mac.doFinal(ByteBuffer.allocate(8).putLong(counter).array());

            int offset = hash[hash.length - 1] & 0x0F;
            int binary = ((hash[offset] & 0x7F) << 24)
                    | ((hash[offset + 1] & 0xFF) << 16)
                    | ((hash[offset + 2] & 0xFF) << 8)
                    | (hash[offset + 3] & 0xFF);
            int otp = binary % (int) Math.pow(10, DIGITS);
            return String.format(Locale.ROOT, "%0" + DIGITS + "d", otp);
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to generate TOTP code", ex);
        }
    }

    private String base32Encode(byte[] data) {
        StringBuilder output = new StringBuilder((data.length * 8 + 4) / 5);
        int buffer = 0;
        int bitsLeft = 0;

        for (byte value : data) {
            buffer = (buffer << 8) | (value & 0xFF);
            bitsLeft += 8;

            while (bitsLeft >= 5) {
                int index = (buffer >> (bitsLeft - 5)) & 0x1F;
                bitsLeft -= 5;
                output.append(BASE32_ALPHABET.charAt(index));
            }
        }

        if (bitsLeft > 0) {
            int index = (buffer << (5 - bitsLeft)) & 0x1F;
            output.append(BASE32_ALPHABET.charAt(index));
        }

        return output.toString();
    }

    private byte[] base32Decode(String value) {
        String normalized = value.replace("=", "").replaceAll("\\s", "").toUpperCase(Locale.ROOT);
        if (normalized.isBlank()) {
            return new byte[0];
        }

        int buffer = 0;
        int bitsLeft = 0;
        byte[] output = new byte[(normalized.length() * 5) / 8];
        int outputIndex = 0;

        for (char ch : normalized.toCharArray()) {
            int digit = BASE32_ALPHABET.indexOf(ch);
            if (digit < 0) {
                throw new IllegalArgumentException("Invalid Base32 character");
            }

            buffer = (buffer << 5) | digit;
            bitsLeft += 5;

            if (bitsLeft >= 8) {
                output[outputIndex++] = (byte) ((buffer >> (bitsLeft - 8)) & 0xFF);
                bitsLeft -= 8;
            }
        }

        if (outputIndex == output.length) {
            return output;
        }

        byte[] trimmed = new byte[outputIndex];
        System.arraycopy(output, 0, trimmed, 0, outputIndex);
        return trimmed;
    }

    private String urlEncode(String input) {
        return URLEncoder.encode(input, StandardCharsets.UTF_8);
    }
}
