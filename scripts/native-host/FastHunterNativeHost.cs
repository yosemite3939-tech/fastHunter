using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Text;
using System.Web.Script.Serialization;

public static class FastHunterNativeHost
{
    private static readonly JavaScriptSerializer Json = new JavaScriptSerializer();

    public static int Main()
    {
        Stream input = Console.OpenStandardInput();
        Stream output = Console.OpenStandardOutput();
        try
        {
            byte[] header = ReadExact(input, 4);
            if (header == null) return 0;
            int length = BitConverter.ToInt32(header, 0);
            if (length <= 0 || length > 64 * 1024 * 1024)
            {
                Write(output, Error("Invalid native messaging payload length."));
                return 1;
            }

            byte[] payload = ReadExact(input, length);
            if (payload == null) return 1;
            Dictionary<string, object> message = Json.Deserialize<Dictionary<string, object>>(Encoding.UTF8.GetString(payload));
            string type = ReadString(message, "type");
            if (type == "ping")
            {
                Write(output, new Dictionary<string, object> {
                    { "ok", true }, { "type", "pong" }, { "app", "FastHunter Downloader" }
                });
                return 0;
            }

            string url = ReadString(message, "url");
            Uri uri;
            if (type != "enqueue" || !Uri.TryCreate(url, UriKind.Absolute, out uri) ||
                (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
            {
                Write(output, Error("Only HTTP and HTTPS download URLs are supported."));
                return 1;
            }

            string executable = Path.GetFullPath(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "FastHunter Downloader.exe"));
            if (!File.Exists(executable))
            {
                Write(output, Error("FastHunter Downloader executable was not found."));
                return 1;
            }

            Process.Start(new ProcessStartInfo {
                FileName = executable,
                Arguments = "--add-url=" + Uri.EscapeDataString(uri.AbsoluteUri),
                UseShellExecute = true
            });
            Write(output, new Dictionary<string, object> {
                { "ok", true }, { "type", "queued" }, { "url", uri.AbsoluteUri }
            });
            return 0;
        }
        catch (Exception exception)
        {
            Write(output, Error(exception.Message));
            return 1;
        }
    }

    private static Dictionary<string, object> Error(string message)
    {
        return new Dictionary<string, object> { { "ok", false }, { "error", message } };
    }

    private static string ReadString(Dictionary<string, object> message, string key)
    {
        object value;
        return message.TryGetValue(key, out value) && value != null ? value.ToString() : "";
    }

    private static byte[] ReadExact(Stream input, int length)
    {
        byte[] buffer = new byte[length];
        int offset = 0;
        while (offset < length)
        {
            int count = input.Read(buffer, offset, length - offset);
            if (count == 0) return null;
            offset += count;
        }
        return buffer;
    }

    private static void Write(Stream output, object message)
    {
        byte[] body = Encoding.UTF8.GetBytes(Json.Serialize(message));
        byte[] header = BitConverter.GetBytes(body.Length);
        output.Write(header, 0, header.Length);
        output.Write(body, 0, body.Length);
        output.Flush();
    }
}
