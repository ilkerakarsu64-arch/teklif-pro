using System;
using System.Drawing;
using System.Windows.Forms;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading;
using System.Collections.Generic;

namespace TeklifProLauncher
{
    static class Program
    {
        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new MainForm());
        }
    }

    public class MainForm : Form
    {
        private Process serverProcess;
        private Label lblStatus;
        private Label lblLocalUrl;
        private Label lblLanUrl;
        private RichTextBox txtLogs;
        private Button btnStart;
        private Button btnStop;
        private Button btnOpenBrowser;
        private Button btnCopyLan;
        private Button btnClearLogs;
        private Panel pnlHeader;
        private Panel pnlConnectionCard;
        private System.Windows.Forms.Timer statusTimer;
        private string primaryLanUrl = "http://localhost:3000";

        public MainForm()
        {
            InitializeComponent();
            DetectNetworkIps();
            StartServer();
        }

        private void InitializeComponent()
        {
            this.Text = "TeklifPro - Sunucu Yönetim Paneli";
            this.Size = new Size(820, 640);
            this.MinimumSize = new Size(750, 550);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.BackColor = Color.FromArgb(15, 23, 42); // Deep slate #0f172a
            this.ForeColor = Color.FromArgb(241, 245, 249);
            this.Font = new Font("Segoe UI", 9.5F, FontStyle.Regular);

            // Set Form Icon if possible
            try
            {
                this.Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath);
            }
            catch { }

            // -------------------------------------------------------------
            // HEADER PANEL
            // -------------------------------------------------------------
            pnlHeader = new Panel
            {
                Dock = DockStyle.Top,
                Height = 85,
                BackColor = Color.FromArgb(30, 41, 59), // #1e293b
                Padding = new Padding(20, 15, 20, 15)
            };

            Label lblTitle = new Label
            {
                Text = "⚡ TEKLİFPRO SUNUCU KONTROL MERKEZİ",
                Font = new Font("Segoe UI", 14F, FontStyle.Bold),
                ForeColor = Color.FromArgb(248, 250, 252),
                AutoSize = true,
                Location = new Point(20, 16)
            };

            Label lblSubtitle = new Label
            {
                Text = "LAN & Yerel Ağ Teklif Yönetim Sistemi Servisi",
                Font = new Font("Segoe UI", 9F, FontStyle.Regular),
                ForeColor = Color.FromArgb(148, 163, 184),
                AutoSize = true,
                Location = new Point(22, 48)
            };

            lblStatus = new Label
            {
                Text = "● SUNUCU BAŞLATILIYOR...",
                Font = new Font("Segoe UI", 9.5F, FontStyle.Bold),
                ForeColor = Color.FromArgb(251, 191, 36), // Amber
                AutoSize = true,
                Anchor = AnchorStyles.Top | AnchorStyles.Right,
                Location = new Point(580, 28)
            };

            pnlHeader.Controls.Add(lblTitle);
            pnlHeader.Controls.Add(lblSubtitle);
            pnlHeader.Controls.Add(lblStatus);

            // -------------------------------------------------------------
            // CONNECTION CARDS PANEL
            // -------------------------------------------------------------
            pnlConnectionCard = new Panel
            {
                Dock = DockStyle.Top,
                Height = 110,
                BackColor = Color.FromArgb(15, 23, 42),
                Padding = new Padding(20, 10, 20, 10)
            };

            GroupBox gbLinks = new GroupBox
            {
                Text = " 🌐 Bağlantı Adresleri ",
                ForeColor = Color.FromArgb(148, 163, 184),
                Font = new Font("Segoe UI", 9F, FontStyle.Bold),
                Dock = DockStyle.Fill,
                Padding = new Padding(15, 10, 15, 10)
            };

            lblLocalUrl = new Label
            {
                Text = "Yerel Erişim (Local):  http://localhost:3000",
                Font = new Font("Segoe UI", 9.5F, FontStyle.Bold),
                ForeColor = Color.FromArgb(56, 189, 248), // Light Blue
                Location = new Point(20, 28),
                AutoSize = true
            };

            lblLanUrl = new Label
            {
                Text = "Ağ Erişimi (LAN IP):  Tespit Ediliyor...",
                Font = new Font("Segoe UI", 9.5F, FontStyle.Bold),
                ForeColor = Color.FromArgb(74, 222, 128), // Light Emerald
                Location = new Point(20, 56),
                AutoSize = true
            };

            btnOpenBrowser = CreateButton("🌐 Tarayıcıda Aç", Color.FromArgb(37, 99, 235), Color.White);
            btnOpenBrowser.Location = new Point(530, 22);
            btnOpenBrowser.Size = new Size(130, 32);
            btnOpenBrowser.Click += (s, e) => OpenInBrowser();

            btnCopyLan = CreateButton("📋 LAN Adresi Kopyala", Color.FromArgb(51, 65, 85), Color.White);
            btnCopyLan.Location = new Point(530, 58);
            btnCopyLan.Size = new Size(150, 32);
            btnCopyLan.Click += (s, e) => CopyLanAddress();

            gbLinks.Controls.Add(lblLocalUrl);
            gbLinks.Controls.Add(lblLanUrl);
            gbLinks.Controls.Add(btnOpenBrowser);
            gbLinks.Controls.Add(btnCopyLan);
            pnlConnectionCard.Controls.Add(gbLinks);

            // -------------------------------------------------------------
            // BUTTON BAR PANEL
            // -------------------------------------------------------------
            Panel pnlButtonBar = new Panel
            {
                Dock = DockStyle.Top,
                Height = 50,
                Padding = new Padding(20, 5, 20, 5)
            };

            btnStart = CreateButton("🚀 Sunucuyu Başlat", Color.FromArgb(16, 185, 129), Color.White);
            btnStart.Location = new Point(20, 8);
            btnStart.Size = new Size(150, 34);
            btnStart.Click += (s, e) => StartServer();

            btnStop = CreateButton("🛑 Sunucuyu Durdur", Color.FromArgb(225, 29, 72), Color.White);
            btnStop.Location = new Point(180, 8);
            btnStop.Size = new Size(150, 34);
            btnStop.Click += (s, e) => StopServer();

            btnClearLogs = CreateButton("🧹 Konsolu Temizle", Color.FromArgb(71, 85, 105), Color.White);
            btnClearLogs.Location = new Point(340, 8);
            btnClearLogs.Size = new Size(140, 34);
            btnClearLogs.Click += (s, e) => txtLogs.Clear();

            pnlButtonBar.Controls.Add(btnStart);
            pnlButtonBar.Controls.Add(btnStop);
            pnlButtonBar.Controls.Add(btnClearLogs);

            // -------------------------------------------------------------
            // LOG TERMINAL PANEL
            // -------------------------------------------------------------
            Panel pnlLogContainer = new Panel
            {
                Dock = DockStyle.Fill,
                Padding = new Padding(20, 5, 20, 20)
            };

            txtLogs = new RichTextBox
            {
                Dock = DockStyle.Fill,
                BackColor = Color.FromArgb(10, 15, 26),
                ForeColor = Color.FromArgb(56, 189, 248),
                Font = new Font("Consolas", 9.5F, FontStyle.Regular),
                ReadOnly = true,
                BorderStyle = BorderStyle.None,
                WordWrap = true
            };

            pnlLogContainer.Controls.Add(txtLogs);

            // Controls layout
            this.Controls.Add(pnlLogContainer);
            this.Controls.Add(pnlButtonBar);
            this.Controls.Add(pnlConnectionCard);
            this.Controls.Add(pnlHeader);

            // Timer for checking server health
            statusTimer = new System.Windows.Forms.Timer();
            statusTimer.Interval = 2000;
            statusTimer.Tick += (s, e) => UpdateServerStatus();
            statusTimer.Start();

            this.FormClosing += (s, e) => StopServer();
        }

        private Button CreateButton(string text, Color bg, Color fg)
        {
            Button btn = new Button
            {
                Text = text,
                BackColor = bg,
                ForeColor = fg,
                FlatStyle = FlatStyle.Flat,
                Font = new Font("Segoe UI", 9F, FontStyle.Bold),
                Cursor = Cursors.Hand,
                UseMnemonic = false
            };
            btn.FlatAppearance.BorderSize = 0;
            return btn;
        }

        private void DetectNetworkIps()
        {
            try
            {
                List<string> ips = new List<string>();
                var host = Dns.GetHostEntry(Dns.GetHostName());
                foreach (var ip in host.AddressList)
                {
                    if (ip.AddressFamily == AddressFamily.InterNetwork && !IPAddress.IsLoopback(ip))
                    {
                        ips.Add(ip.ToString());
                    }
                }

                if (ips.Count > 0)
                {
                    string primaryIp = ips[0];
                    // Prefer 192.168.x.x if available
                    foreach (var ip in ips)
                    {
                        if (ip.StartsWith("192.168."))
                        {
                            primaryIp = ip;
                            break;
                        }
                    }
                    primaryLanUrl = "http://" + primaryIp + ":3000";
                    lblLanUrl.Text = "Ağ Erişimi (LAN IP):  " + primaryLanUrl;
                }
                else
                {
                    lblLanUrl.Text = "Ağ Erişimi (LAN IP):  Tespit EDILEMEDİ";
                }
            }
            catch (Exception ex)
            {
                lblLanUrl.Text = "Ağ Erişimi: " + ex.Message;
            }
        }

        private void StartServer()
        {
            if (serverProcess != null && !serverProcess.HasExited)
            {
                AppendLog("⚠️ Sunucu zaten çalışıyor.\n", Color.Orange);
                return;
            }

            try
            {
                AppendLog("🚀 TeklifPro Sunucusu başlatılıyor...\n", Color.LightGreen);
                lblStatus.Text = "● SUNUCU BAŞLATILIYOR...";
                lblStatus.ForeColor = Color.FromArgb(251, 191, 36);

                string projectDir = AppDomain.CurrentDomain.BaseDirectory;

                ProcessStartInfo psi = new ProcessStartInfo
                {
                    FileName = "cmd.exe",
                    Arguments = "/c npm run dev",
                    WorkingDirectory = projectDir,
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    CreateNoWindow = true,
                    StandardOutputEncoding = Encoding.UTF8,
                    StandardErrorEncoding = Encoding.UTF8
                };

                serverProcess = new Process { StartInfo = psi };
                serverProcess.OutputDataReceived += (s, e) => { if (e.Data != null) AppendLog(e.Data + "\n", Color.FromArgb(56, 189, 248)); };
                serverProcess.ErrorDataReceived += (s, e) => { if (e.Data != null) AppendLog("ERR: " + e.Data + "\n", Color.FromArgb(244, 63, 94)); };

                serverProcess.Start();
                serverProcess.BeginOutputReadLine();
                serverProcess.BeginErrorReadLine();

                btnStart.Enabled = false;
                btnStop.Enabled = true;

                lblStatus.Text = "● SUNUCU AKTİF (PORT 3000)";
                lblStatus.ForeColor = Color.FromArgb(74, 222, 128);
            }
            catch (Exception ex)
            {
                AppendLog("❌ Sunucu başlatılamadı: " + ex.Message + "\n", Color.Red);
                lblStatus.Text = "● HATA OLUŞTU";
                lblStatus.ForeColor = Color.FromArgb(239, 68, 68);
            }
        }

        private void StopServer()
        {
            try
            {
                if (serverProcess != null && !serverProcess.HasExited)
                {
                    AppendLog("🛑 Sunucu kapatılıyor...\n", Color.Orange);
                    
                    // Kill node process tree
                    ProcessStartInfo killPsi = new ProcessStartInfo
                    {
                        FileName = "taskkill",
                        Arguments = "/F /T /PID " + serverProcess.Id,
                        CreateNoWindow = true,
                        UseShellExecute = false
                    };
                    Process.Start(killPsi);

                    serverProcess = null;
                }

                btnStart.Enabled = true;
                btnStop.Enabled = false;

                lblStatus.Text = "● SUNUCU DURDURULDU";
                lblStatus.ForeColor = Color.FromArgb(239, 68, 68);
            }
            catch (Exception ex)
            {
                AppendLog("⚠️ Durdurma uyarısı: " + ex.Message + "\n", Color.Yellow);
            }
        }

        private void UpdateServerStatus()
        {
            if (serverProcess != null && !serverProcess.HasExited)
            {
                lblStatus.Text = "● SUNUCU AKTİF (PORT 3000)";
                lblStatus.ForeColor = Color.FromArgb(74, 222, 128);
                btnStart.Enabled = false;
                btnStop.Enabled = true;
            }
            else if (btnStop.Enabled)
            {
                lblStatus.Text = "● SUNUCU KAPALI";
                lblStatus.ForeColor = Color.FromArgb(239, 68, 68);
                btnStart.Enabled = true;
                btnStop.Enabled = false;
            }
        }

        private void OpenInBrowser()
        {
            try
            {
                Process.Start(new ProcessStartInfo
                {
                    FileName = "http://localhost:3000",
                    UseShellExecute = true
                });
            }
            catch (Exception ex)
            {
                MessageBox.Show("Tarayıcı açılamadı: " + ex.Message, "Hata", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void CopyLanAddress()
        {
            try
            {
                Clipboard.SetText(primaryLanUrl);
                MessageBox.Show("LAN Bağlantı Adresi Kopyalandı:\n\n" + primaryLanUrl + "\n\nAğdaki diğer bilgisayarlardan veya mobil cihazlardan bu adrese erişebilirsiniz.", "Kopyalandı", MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
            catch (Exception ex)
            {
                MessageBox.Show("Kopyalama hatası: " + ex.Message, "Hata", MessageBoxButtons.OK, MessageBoxIcon.Warning);
            }
        }

        private void AppendLog(string text, Color color)
        {
            if (txtLogs.InvokeRequired)
            {
                txtLogs.BeginInvoke(new Action(() => AppendLog(text, color)));
                return;
            }

            txtLogs.SelectionStart = txtLogs.TextLength;
            txtLogs.SelectionLength = 0;
            txtLogs.SelectionColor = color;
            txtLogs.AppendText(text);
            txtLogs.ScrollToCaret();
        }
    }
}
