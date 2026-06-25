// ============================================================================
// SUPABASE AUTHENTICATION & DATABASE INTEGRATION
// File: auth.js
// Purpose: Mengelola login, register, dan sinkronisasi data dengan Supabase
// ============================================================================

// ============ SETUP SUPABASE ============
// Ganti URL dan KEY dengan dari project Supabase kamu
const supabaseUrl = 'https://faicyapnnkhqqsxblsva.supabase.co';
const supabaseKey = 'sb_publishable_vs47oe7Oh_FPX6CcxZa-ig_IU4IsyoD';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

console.log('✅ Supabase initialized');

// ============ LOGIN ============
/**
 * Login dengan email dan password
 * @param {string} email - Email user
 * @param {string} password - Password user
 * @returns {Promise<boolean>} True jika login berhasil
 */
async function login(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
    
    if (error) {
      console.error('❌ Login error:', error.message);
      alert('❌ Login gagal: ' + error.message);
      return false;
    }
    
    console.log('✅ Login berhasil:', data.user.email);
    alert('✅ Login berhasil!');
    return true;
  } catch (err) {
    console.error('Login exception:', err);
    alert('❌ Error: ' + err.message);
    return false;
  }
}

// ============ REGISTER ============
/**
 * Register user baru
 * @param {string} email - Email baru
 * @param {string} password - Password
 * @returns {Promise<boolean>} True jika register berhasil
 */
async function register(email, password) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });
    
    if (error) {
      console.error('❌ Register error:', error.message);
      alert('❌ Register gagal: ' + error.message);
      return false;
    }
    
    console.log('✅ Register berhasil');
    alert('✅ Register berhasil! Cek email kamu untuk verifikasi.');
    return true;
  } catch (err) {
    console.error('Register exception:', err);
    alert('❌ Error: ' + err.message);
    return false;
  }
}

// ============ LOGOUT ============
/**
 * Logout user
 * @returns {Promise<void>}
 */
async function logout() {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('❌ Logout error:', error.message);
      alert('❌ Logout gagal: ' + error.message);
    } else {
      console.log('✅ Logout berhasil');
      alert('✅ Logout berhasil!');
    }
  } catch (err) {
    console.error('Logout exception:', err);
    alert('❌ Error: ' + err.message);
  }
}

// ============ CEK USER YANG LOGIN ============
/**
 * Ambil data user yang sedang login
 * @returns {Promise<Object|null>} User object atau null jika tidak login
 */
async function getUser() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (err) {
    console.error('Get user error:', err);
    return null;
  }
}

// ============ SIMPAN PROGRESS SRS ============
/**
 * Simpan atau update progress SRS ke database
 * @param {string} passageId - ID passage/passage
 * @param {number} level - SRS level (0-5)
 * @returns {Promise<void>}
 */
async function saveSrsProgress(passageId, level) {
  try {
    const user = await getUser();
    if (!user) {
      console.warn('⚠️ User belum login, tidak bisa simpan progress');
      return;
    }
    
    const { data, error } = await supabase
      .from('user_srs_progress')
      .upsert({
        user_id: user.id,
        passage_id: passageId,
        srs_level: level,
        last_reviewed: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'user_id,passage_id'
      });
    
    if (error) {
      console.error('❌ Gagal simpan progress:', error.message);
      return;
    }
    
    console.log('✅ Progress disimpan:', { passageId, level });
  } catch (err) {
    console.error('Save progress exception:', err);
  }
}

// ============ AMBIL PROGRESS SRS ============
/**
 * Ambil progress SRS user dari database
 * @param {string} passageId - ID passage
 * @returns {Promise<Object|null>} Progress data atau null
 */
async function loadSrsProgress(passageId) {
  try {
    const user = await getUser();
    if (!user) {
      console.warn('⚠️ User belum login, tidak bisa muat progress');
      return null;
    }
    
    const { data, error } = await supabase
      .from('user_srs_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('passage_id', passageId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error load progress:', error.message);
      return null;
    }
    
    return data;
  } catch (err) {
    console.error('Load progress exception:', err);
    return null;
  }
}

// ============ SIMPAN JAWABAN USER ============
/**
 * Simpan jawaban user ke database
 * @param {string} passageId - ID passage
 * @param {string} questionId - ID pertanyaan
 * @param {string} selectedAnswer - Jawaban yang dipilih
 * @param {boolean} isCorrect - Apakah jawaban benar
 * @returns {Promise<void>}
 */
async function saveAnswer(passageId, questionId, selectedAnswer, isCorrect) {
  try {
    const user = await getUser();
    if (!user) {
      console.warn('⚠️ User belum login, tidak bisa simpan jawaban');
      return;
    }
    
    const { error } = await supabase
      .from('user_answers')
      .insert({
        user_id: user.id,
        passage_id: passageId,
        question_id: questionId,
        selected_answer: selectedAnswer,
        is_correct: isCorrect,
        answered_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('❌ Gagal simpan jawaban:', error.message);
      return;
    }
    
    console.log('✅ Jawaban disimpan');
  } catch (err) {
    console.error('Save answer exception:', err);
  }
}

// ============ AMBIL SEMUA PROGRESS USER ============
/**
 * Ambil semua progress SRS user
 * @returns {Promise<Array>} Array of progress data
 */
async function loadAllProgress() {
  try {
    const user = await getUser();
    if (!user) {
      console.warn('⚠️ User belum login');
      return [];
    }
    
    const { data, error } = await supabase
      .from('user_srs_progress')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('Error load all progress:', error.message);
      return [];
    }
    
    return data || [];
  } catch (err) {
    console.error('Load all progress exception:', err);
    return [];
  }
}

// ============ RESET PROGRESS (OPTIONAL) ============
/**
 * Reset progress user (Hati-hati!)
 * @param {string} passageId - ID passage
 * @returns {Promise<void>}
 */
async function resetProgress(passageId) {
  try {
    const user = await getUser();
    if (!user) return;
    
    const { error } = await supabase
      .from('user_srs_progress')
      .delete()
      .eq('user_id', user.id)
      .eq('passage_id', passageId);
    
    if (error) {
      console.error('Error reset progress:', error.message);
      return;
    }
    
    console.log('✅ Progress direset');
  } catch (err) {
    console.error('Reset progress exception:', err);
  }
}

// ============ DEBUG: Log Supabase Status ============
async function debugAuth() {
  const user = await getUser();
  console.log('=== AUTH DEBUG ===');
  console.log('User:', user);
  console.log('Supabase URL:', supabaseUrl);
  console.log('==== END DEBUG ====');
}

// Log saat script load
console.log('🎯 auth.js loaded successfully!');
console.log('Available functions: login, register, logout, getUser, saveSrsProgress, loadSrsProgress, saveAnswer, loadAllProgress, resetProgress, debugAuth');
