using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Threading;
using System.Windows.Forms;
using Nefarius.ViGEm.Client;
using Nefarius.ViGEm.Client.Targets;
using Nefarius.ViGEm.Client.Targets.Xbox360;

public class UniversalControllerSupport
{
    [DllImport("winmm.dll")]
    private static extern int joyGetPosEx(int uJoyID, ref JOYINFOEX pji);

    [DllImport("winmm.dll")]
    private static extern int joyGetDevCapsW(UIntPtr uJoyID, ref JOYCAPSW pjc, uint cbjc);

    [StructLayout(LayoutKind.Sequential)]
    private struct JOYINFOEX
    {
        public uint dwSize;
        public uint dwFlags;
        public uint dwXpos;
        public uint dwYpos;
        public uint dwZpos;
        public uint dwRpos;
        public uint dwUpos;
        public uint dwVpos;
        public uint dwButtons;
        public uint dwButtonNumber;
        public uint dwPOV;
        public uint dwReserved1;
        public uint dwReserved2;
    }

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    private struct JOYCAPSW
    {
        public ushort wMid;
        public ushort wPid;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 32)]
        public string szPname;
        public uint wXmin; public uint wXmax;
        public uint wYmin; public uint wYmax;
        public uint wZmin; public uint wZmax;
        public uint wNumButtons;
        public uint wPeriodMin; public uint wPeriodMax;
        public uint wRmin; public uint wRmax;
        public uint wUmin; public uint wUmax;
        public uint wVmin; public uint wVmax;
        public uint wCaps; public uint wMaxAxes;
        public uint wNumAxes; public uint wMaxButtons;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 32)]
        public string szRegKey;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 260)]
        public string szOEMVxD;
    }

    private struct DeviceSlotCache
    {
        public bool IsValid;
        public bool IsIgnoredDevice;
        public JOYCAPSW Caps;
    }

    private const uint JOY_RETURNALL = 0x000000FF;
    private const short DEADZONE = 4000;
    private const int TARGET_FRAME_MS = 8;
    private const ushort VIRTUAL_VID = 0x9999;
    private const ushort VIRTUAL_PID = 0x9999;

    private static ViGEmClient _client;
    private static readonly IXbox360Controller[] _virtualPads = new IXbox360Controller[16];
    private static readonly DeviceSlotCache[] _deviceCache = new DeviceSlotCache[16];
    private static bool _running = true;

    public static void Main()
    {
        try
        {
            Process.GetCurrentProcess().PriorityClass = ProcessPriorityClass.High;
        }
        catch { }

        try
        {
            _client = new ViGEmClient();
        }
        catch (Exception ex)
        {
            MessageBox.Show(
                ex.Message + "\nPlease ensure the ViGEmBus driver is installed on this system.",
                "LC Launcher - ViGEm Driver Missing",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error
            );
            return;
        }

        Thread worker = new Thread(PollLoop)
        {
            IsBackground = true,
            Priority = ThreadPriority.Highest
        };
        worker.Start();

        Application.Run();

        _running = false;

        for (int i = 0; i < 16; i++)
        {
            if (_virtualPads[i] != null)
            {
                try { _virtualPads[i].Disconnect(); } catch { }
                _virtualPads[i] = null;
            }
        }
    }

    private static void RefreshDeviceCache()
    {
        for (int i = 0; i < 16; i++)
        {
            JOYCAPSW caps = new JOYCAPSW();
            if (joyGetDevCapsW((UIntPtr)i, ref caps, (uint)Marshal.SizeOf(typeof(JOYCAPSW))) == 0)
            {
                string name = caps.szPname.ToLowerInvariant();
                bool ignore = (caps.wMid == VIRTUAL_VID && caps.wPid == VIRTUAL_PID) || name.Contains("xbox");

                _deviceCache[i] = new DeviceSlotCache
                {
                    IsValid = true,
                    IsIgnoredDevice = ignore,
                    Caps = caps
                };

                if (ignore && _virtualPads[i] != null)
                {
                    try { _virtualPads[i].Disconnect(); } catch { }
                    _virtualPads[i] = null;
                }
            }
            else
            {
                _deviceCache[i] = new DeviceSlotCache { IsValid = false, IsIgnoredDevice = false };
                if (_virtualPads[i] != null)
                {
                    try { _virtualPads[i].Disconnect(); } catch { }
                    _virtualPads[i] = null;
                }
            }
        }
    }

    private static short NormalizeAxis(uint val, uint min, uint max, bool invert = false)
    {
        if (max <= min) return 0;
        float pct = (float)(val - min) / (max - min);
        short result = (short)((pct * 65535.0f) - 32768.0f);

        if (invert) result = (short)-result;

        if (Math.Abs((int)result) < DEADZONE) return 0;
        return result;
    }

    private static byte NormalizeTrigger(uint val, uint min, uint max)
    {
        if (max <= min) return 0;
        float pct = (float)(val - min) / (max - min);
        if (pct < 0.05f) return 0;
        return (byte)(pct * 255.0f);
    }

    private static void PollLoop()
    {
        JOYINFOEX info = new JOYINFOEX
        {
            dwSize = (uint)Marshal.SizeOf(typeof(JOYINFOEX)),
            dwFlags = JOY_RETURNALL
        };

        Stopwatch rescanTimer = Stopwatch.StartNew();
        Stopwatch frameTimer = new Stopwatch();
        RefreshDeviceCache();

        while (_running)
        {
            frameTimer.Restart();

            if (rescanTimer.ElapsedMilliseconds > 2000)
            {
                RefreshDeviceCache();
                rescanTimer.Restart();
            }

            for (int i = 0; i < 16; i++)
            {
                var slot = _deviceCache[i];
                if (!slot.IsValid || slot.IsIgnoredDevice) continue;

                if (_virtualPads[i] == null)
                {
                    try
                    {
                        var vPad = _client.CreateXbox360Controller(VIRTUAL_VID, VIRTUAL_PID);
                        vPad.Connect();
                        _virtualPads[i] = vPad;
                    }
                    catch { continue; }
                }

                if (joyGetPosEx(i, ref info) == 0)
                {
                    IXbox360Controller pad = _virtualPads[i];

                    // analog sticks
                    pad.SetAxisValue(Xbox360Axis.LeftThumbX, NormalizeAxis(info.dwXpos, slot.Caps.wXmin, slot.Caps.wXmax, false));
                    pad.SetAxisValue(Xbox360Axis.LeftThumbY, NormalizeAxis(info.dwYpos, slot.Caps.wYmin, slot.Caps.wYmax, true));
                    pad.SetAxisValue(Xbox360Axis.RightThumbX, NormalizeAxis(info.dwZpos, slot.Caps.wZmin, slot.Caps.wZmax, false));
                    pad.SetAxisValue(Xbox360Axis.RightThumbY, NormalizeAxis(info.dwRpos, slot.Caps.wRmin, slot.Caps.wRmax, true));

                    // triggers
                    pad.SetSliderValue(Xbox360Slider.LeftTrigger, NormalizeTrigger(info.dwUpos, slot.Caps.wUmin, slot.Caps.wUmax));
                    pad.SetSliderValue(Xbox360Slider.RightTrigger, NormalizeTrigger(info.dwVpos, slot.Caps.wVmin, slot.Caps.wVmax));

                    // btns
                    pad.SetButtonState(Xbox360Button.X, (info.dwButtons & 1) != 0);
                    pad.SetButtonState(Xbox360Button.A, (info.dwButtons & 2) != 0);
                    pad.SetButtonState(Xbox360Button.B, (info.dwButtons & 4) != 0);
                    pad.SetButtonState(Xbox360Button.Y, (info.dwButtons & 8) != 0);

                    pad.SetButtonState(Xbox360Button.LeftShoulder, (info.dwButtons & 16) != 0);
                    pad.SetButtonState(Xbox360Button.RightShoulder, (info.dwButtons & 32) != 0);

                    pad.SetButtonState(Xbox360Button.Back, (info.dwButtons & 256) != 0);
                    pad.SetButtonState(Xbox360Button.Start, (info.dwButtons & 512) != 0);
                    pad.SetButtonState(Xbox360Button.LeftThumb, (info.dwButtons & 1024) != 0);
                    pad.SetButtonState(Xbox360Button.RightThumb, (info.dwButtons & 2048) != 0);

                    // d-pad
                    if (info.dwPOV != 65535)
                    {
                        uint angle = info.dwPOV / 100;
                        pad.SetButtonState(Xbox360Button.Up, angle == 0 || angle == 315 || angle == 45);
                        pad.SetButtonState(Xbox360Button.Right, angle == 90 || angle == 45 || angle == 135);
                        pad.SetButtonState(Xbox360Button.Down, angle == 180 || angle == 135 || angle == 225);
                        pad.SetButtonState(Xbox360Button.Left, angle == 270 || angle == 225 || angle == 315);
                    }
                    else
                    {
                        pad.SetButtonState(Xbox360Button.Up, false);
                        pad.SetButtonState(Xbox360Button.Right, false);
                        pad.SetButtonState(Xbox360Button.Down, false);
                        pad.SetButtonState(Xbox360Button.Left, false);
                    }

                    pad.SubmitReport();
                }
            }

            long elapsed = frameTimer.ElapsedMilliseconds;
            if (elapsed < TARGET_FRAME_MS) Thread.Sleep((int)(TARGET_FRAME_MS - elapsed));
        }
    }
}