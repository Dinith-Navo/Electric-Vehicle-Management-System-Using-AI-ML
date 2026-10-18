import { useRouter } from 'expo-router';

export const useExpoNavigation = () => {
  const router = useRouter();
  
  const screenMap: Record<string, string> = {
    'Dashboard': '/anomaly_detection',
    'DashboardTab': '/anomaly_detection',
    'LiveMonitoring': '/anomaly_detection/live_monitoring',
    'LiveTab': '/anomaly_detection/live_monitoring',
    'AIAnalysis': '/anomaly_detection/ai_analysis',
    'Simulator': '/anomaly_detection/simulator',
    'AnomalyList': '/anomaly_detection/anomaly_list',
    'AnomaliesTab': '/anomaly_detection/anomaly_list',
    'AnomalyDetail': '/anomaly_detection/anomaly_detail',
    'ResearchHome': '/anomaly_detection/research_mode',
    'ResearchTab': '/anomaly_detection/research_mode',
    'ModelComparison': '/anomaly_detection/model_comparison',
    'Analytics': '/anomaly_detection/analytics',
    'Vehicles': '/anomaly_detection/vehicles',
  };

  return {
    navigate: (screen: string, params?: any) => {
      const path = screenMap[screen] || `/anomaly_detection/${screen.toLowerCase()}`;
      router.push({ pathname: path as any, params });
    },
    goBack: () => router.back(),
    push: (path: string, params?: any) => router.push({ pathname: path as any, params }),
    replace: (path: string) => router.replace(path as any),
  };
};
