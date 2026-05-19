import { Injectable, Dependencies, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';

@Injectable()
@Dependencies(ConfigService)
export class EmailService {
  constructor(configService) {
    this.configService = configService;
    this.logger = new Logger(EmailService.name);
    this.transporter = null;
  }

  async onModuleInit() {
    const host = this.configService.get('SMTP_HOST');
    if (!host) {
      this.logger.warn('SMTP no configurado. Notificaciones por correo desactivadas.');
      return;
    }
    this.transporter = nodemailer.createTransport({
      host,
      port: parseInt(this.configService.get('SMTP_PORT') || '587'),
      secure: false,
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });
    this.from = this.configService.get('MAIL_FROM') || 'Inventario Portal <rrrhh1930@gmail.com>';
    this.logger.log('Email service initialized');
  }

  async send(to, subject, html, cc = null) {
    if (!this.transporter) return false;
    if (this.configService.get('DISABLE_EMAIL') === 'true') {
      this.logger.log(`Email omitido (DISABLE_EMAIL): ${subject} → ${to}`);
      return false;
    }
    try {
      const msg = { from: this.from, to, subject, html };
      if (cc) msg.cc = cc;
      await this.transporter.sendMail(msg);
      this.logger.log(`Email enviado a ${to}: ${subject}`);
      return true;
    } catch (e) {
      this.logger.error(`Error enviando email a ${to}: ${e.message}`);
      return false;
    }
  }

  async notificarSolicitudCreada(solicitudId, empleadoCarnet, empleadoNombre, empleadoCorreo, jefeCorreo, motivo) {
    const subject = `Nueva Solicitud de Inventario #${solicitudId}`;
    const html = `
      <h2>Nueva Solicitud de Inventario</h2>
      <p><strong>Solicitud #${solicitudId}</strong></p>
      <p><strong>Solicitante:</strong> ${empleadoNombre} (${empleadoCarnet})</p>
      <p><strong>Motivo:</strong> ${motivo || 'Sin motivo'}</p>
      <p><strong>Estado:</strong> Pendiente de Aprobación</p>
      <hr>
      <p style="color:#666;font-size:12px;">Sistema de Inventario Portal - RH Claroni</p>
    `;
    if (jefeCorreo) await this.send(jefeCorreo, subject, html);
  }

  async notificarSolicitudAprobada(solicitudId, empleadoCarnet, empleadoNombre, empleadoCorreo) {
    const subject = `Solicitud de Inventario #${solicitudId} Aprobada`;
    const html = `
      <h2>Solicitud Aprobada</h2>
      <p><strong>Solicitud #${solicitudId}</strong></p>
      <p>Hola ${empleadoNombre},</p>
      <p>Tu solicitud de inventario ha sido <strong style="color:green">APROBADA</strong> y está pendiente de despacho por bodega.</p>
      <hr>
      <p style="color:#666;font-size:12px;">Sistema de Inventario Portal - RH Claroni</p>
    `;
    if (empleadoCorreo) await this.send(empleadoCorreo, subject, html);
  }

  async notificarSolicitudRechazada(solicitudId, empleadoCarnet, empleadoNombre, empleadoCorreo, motivo) {
    const subject = `Solicitud de Inventario #${solicitudId} Rechazada`;
    const html = `
      <h2>Solicitud Rechazada</h2>
      <p><strong>Solicitud #${solicitudId}</strong></p>
      <p>Hola ${empleadoNombre},</p>
      <p>Tu solicitud de inventario ha sido <strong style="color:red">RECHAZADA</strong>.</p>
      ${motivo ? `<p><strong>Motivo:</strong> ${motivo}</p>` : ''}
      <hr>
      <p style="color:#666;font-size:12px;">Sistema de Inventario Portal - RH Claroni</p>
    `;
    if (empleadoCorreo) await this.send(empleadoCorreo, subject, html);
  }

  async notificarSolicitudDespachada(solicitudId, empleadoCarnet, empleadoNombre, empleadoCorreo, estado) {
    const subject = `Solicitud de Inventario #${solicitudId} ${estado === 'Atendida' ? 'Entregada' : 'Despachada Parcialmente'}`;
    const html = `
      <h2>Solicitud ${estado === 'Atendida' ? 'Entregada' : 'Despacho Parcial'}</h2>
      <p><strong>Solicitud #${solicitudId}</strong></p>
      <p>Hola ${empleadoNombre},</p>
      <p>Tu solicitud ha sido <strong>${estado === 'Atendida' ? 'entregada completamente' : 'despachada parcialmente'}</strong>.</p>
      <hr>
      <p style="color:#666;font-size:12px;">Sistema de Inventario Portal - RH Claroni</p>
    `;
    if (empleadoCorreo) await this.send(empleadoCorreo, subject, html);
  }
}
