import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wiraoctiemkpxzpaarak.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpcmFvY3RpZW1rcHh6cGFhcmFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NDUwMTIsImV4cCI6MjA5NTQyMTAxMn0.PYG38iqu-S31l3ux6RRVQtweC0rI52JHKjn8CjXC7CY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)


