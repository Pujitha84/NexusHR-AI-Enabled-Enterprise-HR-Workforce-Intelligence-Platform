package com.hr_nexus;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class HomeController {

    @GetMapping("/")
    @ResponseBody
    public String home() {
        return """
                <html>
                <head>
                    <title>NexusHR</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            background: #f0f4f8;
                            text-align: center;
                            padding: 100px 20px;
                        }
                        .card {
                            background: white;
                            max-width: 600px;
                            margin: auto;
                            padding: 40px;
                            border-radius: 16px;
                            box-shadow: 0 4px 20px #0001;
                        }
                        h1 { color: #243b64; }
                        p { color: #53657d; }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <h1>Welcome to NexusHR</h1>
                        <p>AI-Enabled Enterprise HR & Workforce Intelligence Platform</p>
                        <p>Your application is running successfully!</p>
                    </div>
                </body>
                </html>
                """;
    }
}