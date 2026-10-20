/**
 * TypingCertificate.js - Official Printable & Downloadable Typing Diploma Engine
 * 
 * Generates an official, high-resolution certificate for students completing
 * Level 5 (Elementary Accreditation) and Level 8 (Grand Master Accreditation).
 * Rendered onto HTML5 Canvas with vector-like fidelity (1920x1080, 16:9 ratio).
 */

export class TypingCertificate {
  /**
   * Render official diploma onto an HTML5 Canvas element.
   * 
   * @param {HTMLCanvasElement} canvas
   * @param {Object} options
   * @param {string} [options.studentName='Campeón/a del Teclado']
   * @param {string} [options.title='Título Oficial de Mecanógrafo/a de Grado Elemental']
   * @param {string} [options.levelName='Nivel 5 - Fila Inferior y Puntuación']
   * @param {string} [options.beltRank='Cinturón Verde']
   * @param {number} [options.accuracy=95]
   * @param {number} [options.wpm=22]
   * @param {number} [options.stars=24]
   * @param {string} [options.date]
   */
  static renderToCanvas(canvas, options = {}) {
    if (!canvas) return;

    const width = 1920;
    const height = 1080;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const studentName = (options.studentName || 'Campeón/a del Teclado').trim();
    const certTitle = (options.title || 'Título Oficial de Mecanografía').toUpperCase();
    const beltRank = options.beltRank || 'Cinturón Verde';
    const accuracy = Math.round(Number(options.accuracy) || 95);
    const wpm = Math.round(Number(options.wpm) || 20);
    const stars = Math.round(Number(options.stars) || 15);
    const dateStr = options.date || new Date().toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    // 1. Rich Parchment / Celestial Gradient Background
    const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 200, width / 2, height / 2, 1100);
    bgGrad.addColorStop(0, '#fffdf7');
    bgGrad.addColorStop(0.65, '#fef5e7');
    bgGrad.addColorStop(1, '#fde8c8');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Elegant Outer Gold Border
    ctx.save();
    ctx.lineWidth = 14;
    ctx.strokeStyle = '#c59b27'; // Dark Gold
    ctx.strokeRect(40, 40, width - 80, height - 80);

    ctx.lineWidth = 4;
    ctx.strokeStyle = '#dfb743'; // Light Gold
    ctx.strokeRect(58, 58, width - 116, height - 116);

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#e8d28a';
    ctx.strokeRect(66, 66, width - 132, height - 132);

    // Corner Ornaments
    const drawCorner = (x, y, flipX, flipY) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
      ctx.fillStyle = '#c59b27';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(80, 0);
      ctx.quadraticCurveTo(30, 30, 0, 80);
      ctx.closePath();
      ctx.fill();

      // Corner stars
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(28, 28, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    drawCorner(70, 70, false, false);
    drawCorner(width - 70, 70, true, false);
    drawCorner(70, height - 70, false, true);
    drawCorner(width - 70, height - 70, true, true);
    ctx.restore();

    // 3. Header Crown & Ribbon
    ctx.save();
    ctx.textAlign = 'center';

    // Top Emblem Text
    ctx.font = '700 28px "Segoe UI", sans-serif';
    ctx.fillStyle = '#8b6914';
    if ('letterSpacing' in ctx) ctx.letterSpacing = '8px';
    ctx.fillText('★ ACADEMIA OFICIAL DE MECANOGRAFÍA MECANO ★', width / 2, 140);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';

    // Large Certificate Title (dynamic scaling to fit canvas width)
    if (certTitle.length > 42) {
      ctx.font = '900 44px "Segoe UI", Georgia, serif';
    } else if (certTitle.length > 28) {
      ctx.font = '900 50px "Segoe UI", Georgia, serif';
    } else {
      ctx.font = '900 62px "Segoe UI", Georgia, serif';
    }
    ctx.fillStyle = '#2d1810';
    ctx.fillText(certTitle, width / 2, 230);

    // Subtitle line
    ctx.font = 'italic 500 32px Georgia, serif';
    ctx.fillStyle = '#6b4f2c';
    ctx.fillText('Por el presente documento oficial se certifica con honores que:', width / 2, 310);

    // 4. Student Name Banner
    const nameY = 415;
    ctx.fillStyle = 'rgba(255, 235, 185, 0.5)';
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(width / 2 - 550, nameY - 60, 1100, 95, 20);
    } else {
      ctx.rect(width / 2 - 550, nameY - 60, 1100, 95);
    }
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#c59b27';
    ctx.stroke();

    ctx.font = '800 56px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(studentName, width / 2, nameY + 6);

    // 5. Official Accreditation Statement
    ctx.font = '400 27px "Segoe UI", sans-serif';
    ctx.fillStyle = '#475569';
    const desc1 = 'Ha completado con éxito y excelencia el programa formativo de mecanografía al tacto,';
    const desc2 = 'demostrando postura ergonómica, coordinación bimanual sin mirar el teclado y dominio pleno del teclado.';
    ctx.fillText(desc1, width / 2, 510);
    ctx.fillText(desc2, width / 2, 555);

    // 6. Stats & Belt Achievements Grid
    const statsY = 660;
    const statBoxWidth = 240;
    const statBoxHeight = 110;
    const statSpacing = 40;
    const totalBoxW = (statBoxWidth * 4) + (statSpacing * 3);
    let startX = (width - totalBoxW) / 2;

    const statsData = [
      { label: 'PRECISIÓN', value: `${accuracy}%`, icon: '🎯', color: '#16a34a' },
      { label: 'VELOCIDAD', value: `${wpm} PPM`, icon: '⚡', color: '#0284c7' },
      { label: 'RANGO OFICIAL', value: beltRank, icon: '🥋', color: '#d97706' },
      { label: 'ESTRELLAS', value: `⭐ ${stars}`, icon: '⭐', color: '#eab308' }
    ];

    statsData.forEach((st, idx) => {
      const bx = startX + idx * (statBoxWidth + statSpacing);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0,0,0,0.06)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 4;
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(bx, statsY, statBoxWidth, statBoxHeight, 16);
      } else {
        ctx.rect(bx, statsY, statBoxWidth, statBoxHeight);
      }
      ctx.fill();
      ctx.shadowColor = 'transparent';

      ctx.lineWidth = 2;
      ctx.strokeStyle = '#e2e8f0';
      ctx.stroke();

      ctx.font = '700 17px "Segoe UI", sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText(st.label, bx + statBoxWidth / 2, statsY + 36);

      ctx.font = '800 28px "Segoe UI", sans-serif';
      ctx.fillStyle = st.color;
      ctx.fillText(st.value, bx + statBoxWidth / 2, statsY + 80);
    });

    // 7. Official Seal & Signatures
    // Left: Date & Location
    ctx.textAlign = 'left';
    ctx.font = '600 22px "Segoe UI", sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText(`Fecha de expedición:`, 180, 890);
    ctx.font = '700 26px "Segoe UI", sans-serif';
    ctx.fillStyle = '#1e293b';
    ctx.fillText(dateStr, 180, 930);

    // Center: Official Gold Seal
    const sealX = width / 2;
    const sealY = 910;
    const sealRadius = 78;

    // Outer scalloped gold seal
    ctx.save();
    ctx.translate(sealX, sealY);
    ctx.fillStyle = '#b48512';
    ctx.beginPath();
    const points = 32;
    for (let i = 0; i < points * 2; i++) {
      const r = (i % 2 === 0) ? sealRadius : sealRadius - 7;
      const angle = (i * Math.PI) / points;
      ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    ctx.closePath();
    ctx.fill();

    // Inner seal ring
    ctx.fillStyle = '#d4af37';
    ctx.beginPath();
    ctx.arc(0, 0, sealRadius - 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, sealRadius - 18, 0, Math.PI * 2);
    ctx.stroke();

    // Seal text & mascot star
    ctx.textAlign = 'center';
    ctx.font = '700 13px "Segoe UI", sans-serif';
    ctx.fillStyle = '#2d1810';
    ctx.fillText('SELLO OFICIAL', 0, -22);
    ctx.font = '800 24px "Segoe UI", sans-serif';
    ctx.fillText('🤖 ROBY', 0, 8);
    ctx.font = '700 12px "Segoe UI", sans-serif';
    ctx.fillText('ACADEMIA MECANO', 0, 32);
    ctx.restore();

    // Right: Signature
    ctx.textAlign = 'right';
    ctx.font = 'italic 700 34px "Brush Script MT", cursive, Georgia';
    ctx.fillStyle = '#1e293b';
    ctx.fillText('Profesor Roby el Robot', width - 180, 905);

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(width - 430, 920);
    ctx.lineTo(width - 180, 920);
    ctx.stroke();

    ctx.font = '600 20px "Segoe UI", sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('Director de Pedagogía y Tutor Virtual', width - 180, 950);

    ctx.restore();
  }

  /**
   * Export the canvas content as a downloadable PNG file.
   * 
   * @param {HTMLCanvasElement} canvas
   * @param {string} [filename='Diploma_Mecanografia_Mecano.png']
   */
  static downloadPNG(canvas, filename = 'Diploma_Mecanografia_Mecano.png') {
    if (!canvas) return;
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('[TypingCertificate] Error downloading certificate image:', err);
    }
  }

  /**
   * Trigger native browser print dialog specifically tailored for the certificate.
   * 
   * @param {HTMLCanvasElement} canvas
   */
  static printCertificate(canvas) {
    if (!canvas) return;
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const win = window.open('', '_blank');
      if (!win) {
        window.print();
        return;
      }

      win.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Título Oficial de Mecanografía - Mecano</title>
          <style>
            @page {
              size: A4 landscape;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              background: #fff;
              width: 100vw;
              height: 100vh;
            }
            img {
              max-width: 98vw;
              max-height: 96vh;
              object-fit: contain;
              box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" onload="window.print(); setTimeout(() => window.close(), 1000);" />
        </body>
        </html>
      `);
      win.document.close();
    } catch (err) {
      console.warn('[TypingCertificate] Failed opening print window, falling back to window.print():', err);
      window.print();
    }
  }
}

export default TypingCertificate;
