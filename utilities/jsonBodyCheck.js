// Middleware to catch invalid JSON syntax errors before they crash the app

export const jsonBodyCheck=((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ 
      error: "Invalid JSON", 
      message: "The request body could not be parsed as valid JSON. Please check your syntax." 
    });
  }
  next();
});
