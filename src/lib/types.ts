export type StudentInfo = {
  nis: string;
  full_name: string;
  nickname: string | null;
  class_name: string;
  photo_url?: string | null;
};
export type GuardianInfo = { full_name: string; relationship: string };

export type CheckResult = {
  status: 'ready' | 'duplicate' | 'rejected';
  message: string;
  student?: StudentInfo;
  guardian?: GuardianInfo;
  previous_scanned_at?: string;
  previous_scanner_name?: string;
};

export type ConfirmResult = {
  status: 'verified' | 'duplicate' | 'rejected';
  message: string;
  log_id?: string;
  scanned_at?: string;
  student?: StudentInfo;
  guardian?: GuardianInfo;
  previous_scanned_at?: string;
  previous_scanner_name?: string;
};

export type Substitute = { name: string; status: string };

export type LogRow = {
  id: string;
  scanned_at: string;
  status: 'verified' | 'duplicate' | 'rejected';
  student_nis: string | null;
  student_name: string | null;
  class_name: string | null;
  guardian_name: string | null;
  relationship: string | null;
  scanner_name: string | null;
  substitute_name: string | null;
  substitute_status: string | null;
};
