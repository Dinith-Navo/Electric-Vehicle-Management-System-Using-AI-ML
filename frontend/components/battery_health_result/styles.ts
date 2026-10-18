import { StyleSheet } from "react-native";

// =========================================================
// STYLES - Battery Health Result
// =========================================================

export const styles =   StyleSheet.create({

    safe: {
      flex: 1,
    },


    topBar: {
      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",

      paddingHorizontal:
        16,

      paddingVertical:
        10,

      borderBottomWidth:
        0.5,
    },


    iconBtn: {
      width:
        36,

      height:
        36,

      borderRadius:
        18,

      borderWidth:
        0.5,

      alignItems:
        "center",

      justifyContent:
        "center",
    },


    topTitle: {
      fontSize:
        15,

      fontWeight:
        "600",
    },


    topSubtitle: {
      fontSize:
        9.5,

      marginTop:
        1,
    },


    tabBar: {
      flexDirection:
        "row",

      borderBottomWidth:
        0.5,
    },


    tabItem: {
      flex:
        1,

      alignItems:
        "center",

      paddingVertical:
        9,

      position:
        "relative",
    },


    tabLabel: {
      fontSize:
        9.5,

      marginTop:
        2,
    },


    tabIndicator: {
      position:
        "absolute",

      bottom:
        0,

      width:
        28,

      height:
        2.5,

      borderRadius:
        2,

      backgroundColor:
        "#534AB7",
    },


    tabContent: {
      padding:
        14,

      paddingBottom:
        90,
    },


    tabTitle: {
      fontSize:
        18,

      fontWeight:
        "600",

      marginBottom:
        4,
    },


    tabSubtitle: {
      fontSize:
        12,

      lineHeight:
        18,

      marginBottom:
        14,
    },


    sectionHeading: {
      fontSize:
        14,

      fontWeight:
        "600",

      marginBottom:
        10,

      marginTop:
        4,
    },


    card: {
      borderWidth:
        0.5,

      borderRadius:
        14,

      padding:
        16,

      marginBottom:
        12,
    },


    cardHeader: {
      flexDirection:
        "row",

      alignItems:
        "flex-start",

      gap:
        10,

      marginBottom:
        4,
    },


    cardTitle: {
      fontSize:
        13,

      fontWeight:
        "600",
    },


    cardText: {
      fontSize:
        11.5,

      lineHeight:
        18,

      marginTop:
        3,
    },


    purpleIcon: {
      width:
        30,

      height:
        30,

      borderRadius:
        8,

      backgroundColor:
        "#EEEDFE",

      alignItems:
        "center",

      justifyContent:
        "center",
    },


    infoRow: {
      flexDirection:
        "row",

      alignItems:
        "flex-start",

      gap:
        10,
    },


    rowBetween: {
      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",

      gap:
        10,
    },


    twoColumn: {
      flexDirection:
        "row",

      gap:
        10,
    },


    smallLabel: {
      fontSize:
        10.5,
    },


    bigMetric: {
      fontSize:
        18,

      fontWeight:
        "600",

      marginTop:
        5,
    },


    behaviorValue: {
      fontSize:
        15,

      fontWeight:
        "600",

      marginTop:
        3,
    },


    progressTrack: {
      height:
        6,

      borderRadius:
        4,

      overflow:
        "hidden",

      marginTop:
        6,
    },


    metricRow: {
      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",

      gap:
        12,

      paddingVertical:
        4,
    },


    metricLabel: {
      fontSize:
        11.5,

      flex:
        1,
    },


    metricValue: {
      fontSize:
        12,

      fontWeight:
        "600",

      maxWidth:
        "58%",

      textAlign:
        "right",
    },


    separator: {
      height:
        0.5,

      marginVertical:
        8,
    },


    badge: {
      alignSelf:
        "flex-start",

      borderRadius:
        20,

      paddingHorizontal:
        8,

      paddingVertical:
        3,
    },


    badgeText: {
      fontSize:
        10,

      fontWeight:
        "600",
    },


    downloadBtn: {
      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "center",

      gap:
        8,

      backgroundColor:
        "#534AB7",

      borderRadius:
        30,

      paddingVertical:
        14,

      marginTop:
        4,
    },


    downloadText: {
      fontSize:
        14,

      fontWeight:
        "600",

      color:
        "#EEEDFE",
    },


    fab: {
      position:
        "absolute",

      bottom:
        24,

      right:
        20,

      width:
        52,

      height:
        52,

      borderRadius:
        26,

      backgroundColor:
        "#534AB7",

      alignItems:
        "center",

      justifyContent:
        "center",

      zIndex:
        99,

      elevation:
        6,
    },

  });

export default styles;
