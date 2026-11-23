-- Pin search_path on the two helper functions that did not set it (advisor 0011).
alter function public.jakarta_today(timestamptz) set search_path = '';
alter function public._student_json(public.students, boolean) set search_path = '';
