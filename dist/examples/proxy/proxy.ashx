<%@ WebHandler Language="C#" Class="proxy" %>
/*
  This proxy page does not have any security checks. It is highly recommended
  that a user deploying this proxy page on their web server, add appropriate
  security checks, for example checking request path, username/password, target
  url, etc.
*/
using System;
using System.Drawing;
using System.IO;
using System.Web;
using System.Collections.Generic;
using System.Text;
using System.Xml.Serialization;
using System.Web.Caching;

/// <summary>
/// Forwards requests to an ArcGIS Server REST resource. Uses information in
/// the proxy.config file to determine properties of the server.
/// </summary>
public class proxy : IHttpHandler {
	
    public void ProcessRequest (HttpContext context) {

        HttpResponse response = context.Response;

        // Get the URL requested by the client (take the entire querystring at once
        //  to handle the case of the URL itself containing querystring parameters)
		string uriString = Uri.UnescapeDataString(context.Request.QueryString.ToString());

        // Get token, if applicable, and append to the request
        string token = getTokenFromConfigFile(uriString);
        if (!String.IsNullOrEmpty(token))
        {
            if (uriString.Contains("?"))
                uriString += "&token=" + token;
            else
                uriString += "?token=" + token;
        }

        Uri uri = new Uri(uriString);

        // Deny internal URIs
        //if (uri.Host.IndexOf(".") == -1 || uri.Host.EndsWith(".local", StringComparison.InvariantCultureIgnoreCase) || uri.Host.StartsWith("172.30.")) {
        //    response.StatusCode = Convert.ToInt32(403);
        //    response.StatusDescription = "Tipo de contenido no permitido / Content type not allowed";
        //    response.Write(string.Format("<html><body><h2>{0}</h2></body></html>", response.StatusDescription));
        //    response.End();
        //    return;
        //}

        System.Net.WebRequest req = System.Net.WebRequest.Create(new Uri(uriString));
		req.Method = context.Request.HttpMethod;
        req.ContentType = context.Request.ContentType;

        // Set body of request for POST requests
        if (context.Request.InputStream.Length > 0)
        {
            byte[] bytes = new byte[context.Request.InputStream.Length];
            context.Request.InputStream.Read(bytes, 0, (int)context.Request.InputStream.Length);
            req.ContentLength = bytes.Length;
            using (Stream outputStream = req.GetRequestStream())
            {
                outputStream.Write(bytes, 0, bytes.Length);
            }
        }
		
        // Send the request to the server
        System.Net.WebResponse serverResponse = null;
        try
        {
            serverResponse = req.GetResponse();
        }
        catch (System.Net.WebException webExc)
        {
            // 20180824 GLS: añado validación para detectar que la excepción sea un error de protocolo y no enmascararlo, si no siendo un 401 no nos enteramos porque devolvemos siempre un error 500
            if(webExc.Status == System.Net.WebExceptionStatus.ProtocolError) {
				response.StatusCode = Convert.ToInt32(((System.Net.HttpWebResponse)webExc.Response).StatusCode);
				response.StatusDescription = ((System.Net.HttpWebResponse)webExc.Response).StatusDescription;
			}
			else {
				response.StatusCode = 500;
				response.StatusDescription = webExc.Status.ToString();					
			}	

            response.Write(webExc.Response);
            response.End();
            return;
        }
        
        // Set up the response to the client
        if (serverResponse != null) {
            response.ContentType = serverResponse.ContentType;

            /// GLS: 10/01/2019 comentado con Roberto, es necesaria para la descarga vectorial múltiple y la posible proxificación necesaria por IE
			if (serverResponse.Headers["content-disposition"] != null) {
				response.AddHeader("content-disposition", serverResponse.Headers["content-disposition"]);
			}

            using (Stream byteStream = serverResponse.GetResponseStream())
            {
                if (serverResponse.ContentType.Contains("text"))
                {
                    // Tell client not to cache the image since it's dynamic
                    response.CacheControl = "no-cache";
                }

                // Binary response (image, lyr file, other binary file)
                BinaryReader br = new BinaryReader(byteStream);
                byte[] buff = new byte[1024];
                int bytes = 0;
                while ((bytes = br.Read(buff, 0, 1024)) > 0)
                {
                    //Write the stream directly to the client 
                    response.OutputStream.Write(buff, 0, bytes);
                }

                br.Close();
                serverResponse.Close();
            }
        }
        response.End();
    }
 
    public bool IsReusable {
        get {
            return false;
        }
    }

    // Gets the token for a server URL from a configuration file
    // TODO: ?modify so can generate a new short-lived token from username/password in the config file
    private string getTokenFromConfigFile(string uri)
    {
        try
        {
            ProxyConfig config = ProxyConfig.GetCurrentConfig();
            if (config != null)
                return config.GetToken(uri);
            else
                throw new ApplicationException(
                    "Proxy.config file does not exist at application root, or is not readable.");
        }
        catch (InvalidOperationException)
        {
            // Proxy is being used for an unsupported service (proxy.config has mustMatch="true")
            HttpResponse response = HttpContext.Current.Response;
            response.StatusCode = (int)System.Net.HttpStatusCode.Forbidden;
            response.End();
        }
        catch (Exception e)
        {
            if (e is ApplicationException)
                throw e;
            
            // just return an empty string at this point
            // -- may want to throw an exception, or add to a log file
        }
        
        return string.Empty;
    }
}

[XmlRoot("ProxyConfig")]
public class ProxyConfig
{
    #region Static Members

    private static object _lockobject = new object();

    public static ProxyConfig LoadProxyConfig(string fileName)
    {
        ProxyConfig config = null;

        lock (_lockobject)
        {
            if (System.IO.File.Exists(fileName))
            {
                XmlSerializer reader = new XmlSerializer(typeof(ProxyConfig));
                using (System.IO.StreamReader file = new System.IO.StreamReader(fileName))
                {
                    config = (ProxyConfig)reader.Deserialize(file);
                }
            }
        }

        return config;
    }

    public static ProxyConfig GetCurrentConfig()
    {
        ProxyConfig config = HttpRuntime.Cache["proxyConfig"] as ProxyConfig;
        if (config == null)
        {
            string fileName = GetFilename(HttpContext.Current);
            config = LoadProxyConfig(fileName);

            if (config != null)
            {
                CacheDependency dep = new CacheDependency(fileName);
                HttpRuntime.Cache.Insert("proxyConfig", config, dep);
            }
        }

        return config;
    }

    public static string GetFilename(HttpContext context)
    {
        return context.Server.MapPath("~/proxy.config");
    }
    #endregion

    ServerUrl[] serverUrls;
    bool mustMatch;

    [XmlArray("serverUrls")]
    [XmlArrayItem("serverUrl")]
    public ServerUrl[] ServerUrls
    {
        get { return this.serverUrls; }
        set { this.serverUrls = value; }
    }

    [XmlAttribute("mustMatch")]
    public bool MustMatch
    {
        get { return mustMatch; }
        set { mustMatch = value; }
    }

    public string GetToken(string uri)
    {
        foreach (ServerUrl su in serverUrls)
        {
            if (su.MatchAll && uri.StartsWith(su.Url, StringComparison.InvariantCultureIgnoreCase))
            {
                return su.Token;
            }
            else
            {
                if (String.Compare(uri, su.Url, StringComparison.InvariantCultureIgnoreCase) == 0)
                    return su.Token;
            }
        }

        if (mustMatch)
            throw new InvalidOperationException();

        return string.Empty;
    }
}

public class ServerUrl
{
    string url;
    bool matchAll;
    string token;

    [XmlAttribute("url")]
    public string Url
    {
        get { return url; }
        set { url = value; }
    }

    [XmlAttribute("matchAll")]
    public bool MatchAll
    {
        get { return matchAll; }
        set { matchAll = value; }
    }

    [XmlAttribute("token")]
    public string Token
    {
        get { return token; }
        set { token = value; }
    }
}
