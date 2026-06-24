import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "@/layouts/AppLayout";
import { AIResultsPage } from "@/pages/AIResultsPage";
import {
  AboutSystemPage,
  AuditTrailExplorerPage,
  ClaimConfirmationPage,
  ClaimPerformanceReportsPage,
  ClaimStatusTimelinePage,
  ClientPortalPage,
  ComplianceDashboardPage,
  ContactPage,
  DeliveryTrackingPage,
  EscalationManagementPage,
  EvidenceGalleryPage,
  EvidenceUploadPage,
  FlaggedClaimsQueuePage,
  ForgotPasswordPage,
  HelpSupportPage,
  InternalNotesPage,
  InvestigatorWorkspacePage,
  LandingPage,
  LoginActivityPage,
  ManualApprovalPage,
  MessageTemplatesPage,
  NotFoundPage,
  NotificationSchedulerPage,
  OtpVerificationPage,
  PendingDocumentsPage,
  PermissionMatrixPage,
  PolicyLookupPage,
  ProfilePage,
  RegisterPage,
  RegulatoryTemplatesPage,
  RiskScoringDashboardPage,
  RoleManagementPage,
  SaveDraftPage,
  SecuritySettingsPage,
  SecureFilePreviewPage,
  SettingsPage,
  TrendAnalysisPage,
  UnauthorizedPage,
  WitnessStatementPage,
  DecisionApprovalPage,
  ExecutiveDashboardPage,
  FraudPatternVisualizationPage
} from "@/pages/EnterprisePages";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { RoleRouteGuard } from "@/routes/RoleRouteGuard";
import { AnalyticsPage } from "@/pages/AnalyticsPage";
import { ClaimDetailPage } from "@/pages/ClaimDetailPage";
import { ClaimEditPage } from "@/pages/ClaimEditPage";
import { AllClaimsPage } from "@/pages/AllClaimsPage";
import { TeamDirectoryPage } from "@/pages/TeamDirectoryPage";
import { ClaimTrackingPage } from "@/pages/ClaimTrackingPage";
import { FraudPage } from "@/pages/FraudPage";
import { HomePage } from "@/pages/HomePage";
import { LoginPage } from "@/pages/LoginPage";
import { MissingDocumentsRequestPage } from "@/pages/MissingDocumentsRequestPage";
import { MessagesPage } from "@/pages/MessagesPage";
import { NotificationsPage } from "@/pages/NotificationsPage";
import { ReportBuilderPage } from "@/pages/ReportBuilderPage";
import { ReportsPage } from "@/pages/ReportsPage";
import { SubmissionPage } from "@/pages/SubmissionPage";
import { UserManagementPage } from "@/pages/UserManagementPage";
import { VerificationPage } from "@/pages/VerificationPage";
import { RouteErrorFallback } from "@/components/RouteErrorFallback";

export const router = createBrowserRouter([
  {
    id: "app-root",
    errorElement: <RouteErrorFallback />,
    children: [
  { path: "/", element: <LandingPage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  { path: "/otp-verification", element: <OtpVerificationPage /> },
  { path: "/about", element: <AboutSystemPage /> },
  { path: "/contact", element: <ContactPage /> },
  { path: "/help", element: <HelpSupportPage /> },
  { path: "/unauthorized", element: <UnauthorizedPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <RoleRouteGuard />,
        children: [
          {
            element: <AppLayout />,
            children: [
          { path: "/dashboard", element: <HomePage /> },
          { path: "/claims/new", element: <SubmissionPage /> },
          { path: "/claims/drafts", element: <SaveDraftPage /> },
          { path: "/claims/confirmation", element: <ClaimConfirmationPage /> },
          { path: "/claims/policy-lookup", element: <PolicyLookupPage /> },
          { path: "/tracking", element: <ClaimTrackingPage /> },
          { path: "/tracking/timeline", element: <ClaimStatusTimelinePage /> },
          { path: "/tracking/client-portal", element: <ClientPortalPage /> },
          { path: "/claims/:claimId/edit", element: <ClaimEditPage /> },
          { path: "/claims/:claimId", element: <ClaimDetailPage /> },
          { path: "/verification/all-claims", element: <AllClaimsPage /> },
          { path: "/team/users", element: <TeamDirectoryPage /> },
          { path: "/verification", element: <VerificationPage /> },
          { path: "/verification/pending", element: <PendingDocumentsPage /> },
          { path: "/verification/ai-results", element: <AIResultsPage /> },
          { path: "/verification/missing-request", element: <MissingDocumentsRequestPage /> },
          { path: "/verification/manual-approval", element: <ManualApprovalPage /> },
          { path: "/evidence/upload", element: <EvidenceUploadPage /> },
          { path: "/evidence/gallery", element: <EvidenceGalleryPage /> },
          { path: "/evidence/witness-statements", element: <WitnessStatementPage /> },
          { path: "/evidence/secure-preview", element: <SecureFilePreviewPage /> },
          { path: "/evaluation/decision", element: <DecisionApprovalPage /> },
          { path: "/evaluation/escalations", element: <EscalationManagementPage /> },
          { path: "/evaluation/internal-notes", element: <InternalNotesPage /> },
          { path: "/fraud", element: <FraudPage /> },
          { path: "/fraud/risk-scoring", element: <RiskScoringDashboardPage /> },
          { path: "/fraud/flagged-claims", element: <FlaggedClaimsQueuePage /> },
          { path: "/fraud/pattern-visualization", element: <FraudPatternVisualizationPage /> },
          { path: "/fraud/investigator-workspace", element: <InvestigatorWorkspacePage /> },
          { path: "/analytics", element: <AnalyticsPage /> },
          { path: "/analytics/executive", element: <ExecutiveDashboardPage /> },
          { path: "/analytics/performance", element: <ClaimPerformanceReportsPage /> },
          { path: "/analytics/trends", element: <TrendAnalysisPage /> },
          { path: "/reports", element: <ReportsPage /> },
          { path: "/reports/compliance", element: <ComplianceDashboardPage /> },
          { path: "/reports/builder", element: <ReportBuilderPage /> },
          { path: "/reports/regulatory-templates", element: <RegulatoryTemplatesPage /> },
          { path: "/reports/audit-trail", element: <AuditTrailExplorerPage /> },
          { path: "/notifications", element: <NotificationsPage /> },
          { path: "/messages", element: <MessagesPage /> },
          { path: "/notifications/templates", element: <MessageTemplatesPage /> },
          { path: "/notifications/scheduler", element: <NotificationSchedulerPage /> },
          { path: "/notifications/delivery", element: <DeliveryTrackingPage /> },
          { path: "/profile", element: <ProfilePage /> },
          { path: "/settings", element: <SettingsPage /> },
          {
            element: <ProtectedRoute allowedRoles={["admin"]} />,
            children: [{ path: "/admin/users", element: <UserManagementPage /> }]
          },
          {
            element: <ProtectedRoute allowedRoles={["admin"]} />,
            children: [
              { path: "/admin/roles", element: <RoleManagementPage /> },
              { path: "/admin/permissions", element: <PermissionMatrixPage /> },
              { path: "/admin/login-activity", element: <LoginActivityPage /> },
              { path: "/admin/security", element: <SecuritySettingsPage /> }
            ]
          }
            ]
          }
        ]
      }
    ]
  },
  { path: "*", element: <NotFoundPage /> }
    ]
  }
]);
