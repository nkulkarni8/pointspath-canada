# Contributing to Points Optimizer Canada

Thank you for your interest in contributing! 🎉

## How to Contribute

### Reporting Bugs
- Use GitHub Issues
- Include: browser, OS, steps to reproduce
- Screenshots help!

### Suggesting Features
- Open an issue with "Feature Request" label
- Explain the use case
- Describe expected behavior

### Data Updates
Know of updated credit card offers or new routes?

1. Fork the repo
2. Update `backend/latest_cards_data.py` or routes data
3. Run `python view_database.py` to verify
4. Submit PR with source links

### Code Contributions

1. **Fork & Clone**
```bash
git clone https://github.com/nkulkarni8/points-optimizer-canada.git
```

2. **Create Branch**
```bash
git checkout -b feature/your-feature-name
```

3. **Make Changes**
- Follow existing code style
- Add comments for complex logic
- Update README if needed

4. **Test Locally**
```bash
# Backend
cd backend
python -m pytest

# Frontend
cd frontend
npm run build
```

5. **Commit**
```bash
git add .
git commit -m "Add: brief description of changes"
```

6. **Push & PR**
```bash
git push origin feature/your-feature-name
```
Then open a Pull Request on GitHub

## Code Style

**Python**
- PEP 8 style guide
- Use type hints where possible
- Docstrings for functions

**JavaScript/React**
- ES6+ syntax
- Functional components with hooks
- Descriptive variable names

## Questions?

Open an issue with the "question" label!
```

Create `LICENSE`:
```
MIT License

Copyright (c) 2026 [Your Name]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.