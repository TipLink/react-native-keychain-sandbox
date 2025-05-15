import {
  getEnrolledLevelAsync,
  SecurityLevel,
} from "expo-local-authentication";
import { useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  ACCESS_CONTROL,
  ACCESSIBLE,
  AUTHENTICATION_TYPE,
  getGenericPassword,
  SECURITY_LEVEL,
  setGenericPassword,
} from "react-native-keychain";

interface RnkOptions {
  service: string;
  accessible: ACCESSIBLE;
  accessControl: ACCESS_CONTROL;
  authenticationType: AUTHENTICATION_TYPE;
  securityLevel: SECURITY_LEVEL;
}

const BaseOptions = {
  accessible: ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  authenticationType: AUTHENTICATION_TYPE.DEVICE_PASSCODE_OR_BIOMETRICS,
  securityLevel: SECURITY_LEVEL.SECURE_HARDWARE,
};

const BaseOptionsBiometrics = {
  ...BaseOptions,
  accessControl: ACCESS_CONTROL.BIOMETRY_CURRENT_SET_OR_DEVICE_PASSCODE,
};

const BaseOptionsDevicePasscode = {
  ...BaseOptions,
  accessControl: ACCESS_CONTROL.DEVICE_PASSCODE,
};

async function getRnkeychainAccessOptions(key: string): Promise<RnkOptions> {
  const enrollmentLevel = await getEnrolledLevelAsync();

  if (enrollmentLevel === SecurityLevel.NONE) {
    throw new Error("Device security required");
  }

  if (enrollmentLevel === SecurityLevel.BIOMETRIC_STRONG) {
    return { service: key, ...BaseOptionsBiometrics };
  }

  return { service: key, ...BaseOptionsDevicePasscode };
}

async function getKey(key: string) {
  const options = await getRnkeychainAccessOptions(key);
  return getGenericPassword(options);
}

async function setKey(key: string, value: string) {
  const options = await getRnkeychainAccessOptions(key);
  return setGenericPassword(key, value, options);
}

export default function Index() {
  const [saveKey, setSaveKey] = useState("");
  const [saveValue, setSaveValue] = useState("");
  const [getKeyInput, setGetKeyInput] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const handleSave = async () => {
    if (!saveKey || !saveValue) {
      Alert.alert("Both key and value are required");
      return;
    }
    try {
      await setKey(saveKey, saveValue);
      setResult(`✅ Saved "${saveKey}"`);
      setSaveKey("");
      setSaveValue("");
    } catch (err) {
      console.error("setKey error", err);
      setResult("❌ Failed to save value – see console");
    }
  };

  const handleGet = async () => {
    if (!getKeyInput) {
      Alert.alert("Enter a key to retrieve");
      return;
    }
    try {
      const creds = await getKey(getKeyInput);
      if (creds) {
        // creds = { username, password }
        setResult(`🔒 "${creds.username}" ➜ "${creds.password}"`);
      } else {
        setResult("ℹ️ No entry found for that key");
      }
    } catch (err) {
      console.error("getKey error", err);
      setResult("❌ Failed to get value – see console");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeader}>Save to Keychain</Text>

      <TextInput
        style={styles.input}
        placeholder="Key"
        placeholderTextColor="#999"
        value={saveKey}
        onChangeText={setSaveKey}
      />
      <TextInput
        style={styles.input}
        placeholder="Value"
        placeholderTextColor="#999"
        secureTextEntry
        value={saveValue}
        onChangeText={setSaveValue}
      />
      <Pressable style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Save</Text>
      </Pressable>

      <Text style={styles.sectionHeader}>Get from Keychain</Text>

      <TextInput
        style={styles.input}
        placeholder="Key"
        placeholderTextColor="#999"
        value={getKeyInput}
        onChangeText={setGetKeyInput}
      />
      <Pressable style={styles.button} onPress={handleGet}>
        <Text style={styles.buttonText}>Get</Text>
      </Pressable>

      <Text style={styles.sectionHeader}>Result</Text>
      <Text selectable style={styles.resultText}>
        {result ?? "—"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flex: 1,
    gap: 8,
    backgroundColor: "#f8fafc",
  },
  sectionHeader: { fontWeight: "600", marginTop: 8, color: "#222" },
  input: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "white",
    paddingHorizontal: 12,
    color: "black",
  },
  button: {
    height: 48,
    borderRadius: 8,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { color: "white", fontWeight: "600" },
  resultText: { color: "#111" },
});
