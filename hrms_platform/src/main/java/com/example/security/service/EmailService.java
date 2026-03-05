package com.example.security.service;


import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    @Value("${app.mail.from-name:Bubble Support}")
    private String fromName;

    @Value("${app.mail.brand-name:Bubble HRMS}")
    private String brandName;

    @Value("${app.mail.brand-domain:bubble.com}")
    private String brandDomain;

    @Value("${app.mail.brand-color:#0f172a}")
    private String brandColor;

    @Value("${app.frontend.base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    @Value("${app.mail.hr-contact-email:hr@bounteous.com}")
    private String hrContactEmail;

    @Value("${app.mail.hr-contact-phone:+1 (123) 121-5656}")
    private String hrContactPhone;

    public void sendPasswordResetEmail(String toEmail, String resetLink) {
        log.info("EmailService: sendPasswordResetEmail to={}", toEmail);
        String subject = "HRMS Password Reset";
        String text =
                "Hi,\n\n" +
                        "We received a request to reset your Bubble.\n\n" +
                        "Reset password: " + resetLink + "\n\n" +
                        "This link is valid for 15 minutes.\n\n" +
                        "If you did not request this, please ignore this email.\n\n" +
                        "Regards,\n" +
                        "Bubble Support";
        String html = buildPasswordResetHtml(resetLink);

        sendHtmlEmail(toEmail, subject, text, html);
    }

    public void sendEmployeeOnboardingEmail(String toEmail, String companyEmail, String tempPassword) {
        log.info("EmailService: sendEmployeeOnboardingEmail to={} companyEmail={}", toEmail, companyEmail);
        String loginUrl = frontendBaseUrl + "/login";
        String subject = "Bubble - Your Login Details";
        String text =
                "Hi,\n\n" +
                        "Welcome to Bounteous!\n\n" +
                        "We are excited to have you onboard. Your HRMS account has been created so you can access " +
                        "your profile, documents, and time/leave information in one place. Please review your details " +
                        "after logging in and keep them up to date so we can support you better.\n\n" +
                        "Login details:\n" +
                        "Company Email (username): " + companyEmail + "\n" +
                        "Temporary Password: " + tempPassword + "\n\n" +
                        "Login: " + loginUrl + "\n\n" +
                        "Please change your password after your first login.\n\n" +
                        "Regards,\n" +
                        "HR Team, Bounteous";
        String html = buildHtmlContent(companyEmail, tempPassword, loginUrl);

        sendHtmlEmail(toEmail, subject, text, html);
    }

    private void sendHtmlEmail(String toEmail, String subject, String text, String html) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            if (fromEmail != null && !fromEmail.isBlank()) {
                try {
                    helper.setFrom(fromEmail, fromName);
                } catch (java.io.UnsupportedEncodingException ex) {
                    log.error("EmailService: invalid fromName encoding, falling back to fromEmail only", ex);
                    helper.setFrom(fromEmail);
                }
            } else {
                log.warn("EmailService: fromEmail is blank; using default mail sender from address");
            }
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(text, html);

            mailSender.send(mimeMessage);
            log.info("EmailService: email sent to={} subject={}", toEmail, subject);
        } catch (MessagingException ex) {
            log.error("EmailService: failed to build email to={} subject={}", toEmail, subject, ex);
            throw new RuntimeException(ex);
        } catch (Exception ex) {
            log.error("EmailService: failed to send email to={} subject={}", toEmail, subject, ex);
            throw ex;
        }
    }

    private String buildLogoHtml() {
        String svg =
                "<svg width=\"44\" height=\"44\" viewBox=\"0 0 44 44\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">" +
                        "<rect width=\"44\" height=\"44\" rx=\"12\" fill=\"" + brandColor + "\"/>" +
                        "<path d=\"M14 24c0-4.4 3.6-8 8-8 4.4 0 8 3.6 8 8 0 2.2-.9 4.2-2.3 5.7\" stroke=\"#ffffff\" stroke-width=\"3\" stroke-linecap=\"round\"/>" +
                        "<circle cx=\"29.5\" cy=\"29.5\" r=\"4.5\" fill=\"#ffffff\"/>" +
                        "</svg>";

        return "<div style=\"display:flex; align-items:center; gap:12px; margin-bottom:8px;\">" +
                svg +
                "<div style=\"font-size:20px; font-weight:700; color:#0f172a;\">" + brandName + "</div>" +
                "</div>";
    }

    private String buildPasswordResetHtml(String resetLink) {
        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            background-color: #f4f6f8;
                            padding: 20px;
                        }
                        .container {
                            max-width: 600px;
                            margin: auto;
                            background-color: #ffffff;
                            border-radius: 8px;
                            overflow: hidden;
                            box-shadow: 0 0 10px rgba(0,0,0,0.1);
                        }
                        .header {
                            background-color: %s;
                            color: #ffffff;
                            padding: 20px;
                            text-align: center;
                            font-size: 20px;
                            font-weight: bold;
                        }
                        .content {
                            padding: 25px;
                            color: #333333;
                            line-height: 1.6;
                        }
                        .button {
                            display: inline-block;
                            background-color: %s;
                            color: #ffffff !important;
                            padding: 12px 20px;
                            text-decoration: none;
                            border-radius: 5px;
                            font-weight: bold;
                            margin: 20px 0;
                        }
                        .warning {
                            background-color: #fef3c7;
                            padding: 15px;
                            border-left: 4px solid #f59e0b;
                            margin: 20px 0;
                            font-size: 14px;
                        }
                        .footer {
                            text-align: center;
                            padding: 15px;
                            font-size: 12px;
                            color: #777777;
                            background-color: #fafafa;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            Welcome to Bounteous
                        </div>

                        <div class="content">
                            <p>Hello,</p>

                            <p>
                                We received a request to reset your HRMS account password.
                                Click the button below to proceed.
                            </p>

                            <p style="text-align:center;">
                                <a href="%s" class="button">
                                    Reset Password
                                </a>
                            </p>

                            <div class="warning">
                                This reset link is valid for <strong>15 minutes</strong>.
                                If the link expires, please request a new password reset.
                            </div>

                            <p>
                                If you did not request this password reset,
                                please ignore this email. Your account remains secure.
                            </p>

                            <p>
                                For assistance, contact the HR or IT support team.
                            </p>

                            <p>Best regards,<br/>
                               <strong>HR Team, Bounteous</strong></p>
                        </div>

                        <div class="footer">
                            This is an automated email. Please do not reply.<br/>
                            HR Contact: %s | %s
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(brandColor, brandColor, resetLink, hrContactEmail, hrContactPhone);
    }

    private String buildHtmlContent(String companyEmail, String tempPassword, String loginUrl) {
        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            background-color: #f4f6f8;
                            padding: 20px;
                        }
                        .container {
                            max-width: 600px;
                            margin: auto;
                            background-color: #ffffff;
                            border-radius: 8px;
                            overflow: hidden;
                            box-shadow: 0 0 10px rgba(0,0,0,0.1);
                        }
                        .header {
                            background-color: %s;
                            color: #ffffff;
                            padding: 20px;
                            text-align: center;
                            font-size: 20px;
                            font-weight: bold;
                        }
                        .content {
                            padding: 25px;
                            color: #333333;
                            line-height: 1.6;
                        }
                        .credentials {
                            background-color: #f1f5f9;
                            padding: 15px;
                            border-radius: 6px;
                            margin: 20px 0;
                            font-size: 15px;
                        }
                        .credentials p {
                            margin: 8px 0;
                        }
                        .button {
                            display: inline-block;
                            background-color: %s;
                            color: #ffffff !important;
                            padding: 12px 20px;
                            text-decoration: none;
                            border-radius: 5px;
                            font-weight: bold;
                            margin: 10px 0 0 0;
                        }
                        .footer {
                            text-align: center;
                            padding: 15px;
                            font-size: 12px;
                            color: #777777;
                            background-color: #fafafa;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            Welcome to Bounteous
                        </div>
                        <div class="content">
                            <p>Hello,</p>
                            <p>
                                We are excited to have you onboard.
                                Your company account has been successfully created.
                            </p>
                            <div class="credentials">
                                <p><strong>Company Email:</strong> %s</p>
                                <p><strong>Temporary Password:</strong> %s</p>
                            </div>
                            <p>
                                Please log in using the above credentials and
                                <strong>change your password immediately</strong>
                                during your first login.
                            </p>
                            <p style="text-align:center;">
                                <a href="%s" class="button">
                                    Go to HRMS
                                </a>
                            </p>
                            <p>
                                If you have any issues accessing your account,
                                please contact the HR or IT support team.
                            </p>
                            <p>Best regards,<br/>
                               <strong>HR Team</strong></p>
                        </div>
                        <div class="footer">
                            This is an automated email. Please do not reply.<br/>
                            HR Contact: %s | %s
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(brandColor, brandColor, companyEmail, tempPassword, loginUrl, hrContactEmail, hrContactPhone);
    }

    public void sendAdminProvisionEmail(String toEmail,
                                        String username,
                                        String tempPassword) {

        String subject = "Admin Account Provisioned";

        String textContent = """
            Your Admin Account has been created.

            Username: %s
            Temporary Password: %s

            Please login and change your password immediately.
            """.formatted(username, tempPassword);

        String htmlContent = """
            <html>
                <body style="font-family: Arial, sans-serif;">
                    <h2>Admin Account Provisioned</h2>
                    <p>Your Admin Account has been created.</p>
                    <p><strong>Username:</strong> %s</p>
                    <p><strong>Temporary Password:</strong> %s</p>
                    <p>Please login and change your password immediately.</p>
                </body>
            </html>
            """.formatted(username, tempPassword);

        sendHtmlEmail(toEmail, subject, textContent, htmlContent);
    }
}


