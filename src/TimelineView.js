import React from "react";
import { View, Text, StyleSheet } from "react-native";

export const TimelineView = ({ stepLabels, currentStepIndex }) => (
  <View style={styles.timeline}>
    {stepLabels.map((label, index) => (
      <Text
        key={index}
        style={[
          styles.timelineLabel,
          index === currentStepIndex && styles.timelineLabelActive,
        ]}
      >
        {label}
      </Text>
    ))}
  </View>
);

const styles = StyleSheet.create({
  timeline: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 12,
  },
  timelineLabel: {
    marginHorizontal: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: "#eee",
    fontSize: 12,
    color: "#888",
  },
  timelineLabelActive: {
    backgroundColor: "#ffd700",
    color: "#000",
    fontWeight: "bold",
  },
});
