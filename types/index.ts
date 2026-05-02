export interface School {
  id: string;
  name: string;
  district: string;
  city: string;
  campus?: string;
  phone?: string;
  website?: string;
  instagram?: string;
  verified: boolean;
  isPremium?: boolean;
  logoColor: string;
  description?: string;
  registrationStartDate?: string;
  registrationDeadline?: string;
}

export interface Exam {
  id: string;
  schoolId: string;
  examName: string;
  examDate: string;
  applicationStartDate?: string;
  applicationDeadline: string;
  eligibleGrades: string[];
  district: string;
  city: string;
  status: 'open' | 'upcoming' | 'closed';
  verificationStatus: 'verified' | 'pending' | 'outdated';
  sourceType: string;
  isFeatured?: boolean;
  examLocation?: string;
  applicationUrl?: string;
  notes?: string;
}

export interface PendingUpdate {
  id: string;
  schoolName: string;
  type: 'new_exam' | 'date_change' | 'source_issue';
  detected: string;
  detectedDate?: string;
  source: string;
  confidence: number;
  status: 'pending';
}
