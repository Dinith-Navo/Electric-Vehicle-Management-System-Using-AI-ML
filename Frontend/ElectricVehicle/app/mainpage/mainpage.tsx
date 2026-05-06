import React from "react";
import {
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";

const features = [
  {
    title: "Post-Sale EV Performance Intelligence & Failure Prediction System",
    color: "#6C63FF",
    route: null, // add route when ready
  },
  {
    title: "Adaptive Battery Health Prediction Based on Charging & Driving Behavior",
    color: "#00BFA6",
    route: "/battery_health/battery_health_main",
  },
  {
    title: "Intelligent EV Problem Diagnosis with Context-Aware Do's & Don'ts Engine",
    color: "#FF6F61",
    route: null,
  },
  {
    title: "Predictive Charging & Breakdown Assistance System",
    color: "#FFA726",
    route: null,
  },
];

const MainPage = () => {
  const router = useRouter();

  const handlePress = (route: string | null) => {
    if (route) {
      router.push(route as any);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>SmartEV 🚗</Text>

      <Text style={styles.subtitle}>
        Electric Vehicle Management System using AI & ML
      </Text>

      {features.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={[styles.card, { backgroundColor: item.color }]}
          onPress={() => handlePress(item.route)}
          activeOpacity={item.route ? 0.8 : 1}
        >
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.explore}>Explore →</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

export default MainPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F6FA",
    padding: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#222",
    marginTop: 40,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 25,
  },
  card: {
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 4,
  },
  cardTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  explore: {
    marginTop: 10,
    color: "#fff",
    fontWeight: "600",
  },
});