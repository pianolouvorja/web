// Retorna o comando kiosk por SO. Detecta via navigator.userAgent — o card
// TVs do operador mostra o comando certo pra máquina de projeção.
// Windows não roda .sh: usa .cmd+PowerShell inline (sem terminal p/ leigo).

type KioskCommand = {
  so: 'windows' | 'macos' | 'linux' | 'desconhecido'
  /** true = PowerShell disponível (leigo cola 1 linha); false = bash */
  viaPowerShell: boolean
  comando: string
}

export function kioskCommandFor(userAgent: string, receiverUrl: string, scriptBase: string): KioskCommand {
  const isWindows = /Windows NT/i.test(userAgent)
  const isMac = /Macintosh|Mac OS X/i.test(userAgent)

  if (isWindows) {
    // .cmd baixado do túnel; executa em 1 duplo-clique OU 1 linha PowerShell.
    const scriptUrl = `${scriptBase}/palco-kiosk.cmd`
    const psInline = `iwr '${scriptUrl}' -OutFile palco-kiosk.cmd; .\\palco-kiosk.cmd --url '${receiverUrl}'`
    return { so: 'windows', viaPowerShell: true, comando: psInline }
  }

  if (isMac) {
    const scriptUrl = `${scriptBase}/palco-kiosk.sh`
    return {
      so: 'macos',
      viaPowerShell: false,
      comando: `curl -fsSLO '${scriptUrl}' && chmod +x palco-kiosk.sh && ./palco-kiosk.sh --url '${receiverUrl}'`,
    }
  }

  // Linux (default) — X11 usa --all; Wayland cai no --screen manual.
  const scriptUrl = `${scriptBase}/palco-kiosk.sh`
  return {
    so: 'linux',
    viaPowerShell: false,
    comando: `curl -fsSLO '${scriptUrl}' && chmod +x palco-kiosk.sh && ./palco-kiosk.sh --url '${receiverUrl}' --all`,
  }
}
