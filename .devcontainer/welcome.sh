# Sourced by every interactive shell in the dev container: says where GUI
# programs will appear.

if [ -d /usr/local/novnc ]; then
  if ss -ltn 2> /dev/null | grep -q '127\.0\.0\.1:6080 '; then
    echo "VNC desktop for GUI programs (RViz, rqt):"
  else
    echo "VNC desktop for GUI programs (RViz, rqt), still starting up:"
  fi
  echo "  browser:    http://localhost:6080/vnc.html?autoconnect=true&resize=remote"
  echo "  VNC viewer: localhost:5901 (no password)"
elif [ -n "${DISPLAY:-}" ]; then
  echo "GUI programs (RViz, rqt) open as windows on your desktop (DISPLAY=$DISPLAY)."
fi
