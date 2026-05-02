import React from 'react';
import { ProtectedRoute } from '../../navigation/ProtectedRoute';
import { MyPlanScreen } from '../../screens/plan/MyPlanScreen';

export default function PlanScreen() {
  return (
    <ProtectedRoute returnTo="/plan">
      <MyPlanScreen />
    </ProtectedRoute>
  );
}
