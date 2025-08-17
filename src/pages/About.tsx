const About = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">About Us</h1>
      <div className="space-y-4 text-lg">
        <p>
          This website provides a set of universal steganography tools designed with a privacy-first approach.
          Our mission is to offer easy-to-use, practical, and educational tools for hiding data in various media formats.
        </p>
        <p>
          All encoding and decoding operations are performed directly in your browser (client-side),
          which means your secret messages and files are never uploaded to our servers. Your privacy is paramount.
        </p>
        <p>
          This project was built by <span className="font-semibold">Deep With Darby</span> using modern web technologies, including React,
          Tailwind CSS, and Firebase for secure authentication.
        </p>
      </div>
    </div>
  );
};

export default About;
