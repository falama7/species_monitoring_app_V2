from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from datetime import datetime
import matplotlib.pyplot as plt
import seaborn as sns
import io
import base64

from ..models import Observation, Species

def generate_report_pdf(project, file_path):
    """Generate comprehensive project report as PDF"""
    
    doc = SimpleDocTemplate(file_path, pagesize=A4)
    story = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=30,
        alignment=TA_CENTER,
        textColor=colors.darkblue
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=16,
        spaceAfter=12,
        textColor=colors.darkgreen
    )
    
    # Title page
    story.append(Paragraph("Species Monitoring Report", title_style))
    story.append(Spacer(1, 20))
    
    story.append(Paragraph(f"Project: {project.name}", styles['Heading2']))
    story.append(Spacer(1, 12))
    
    if project.description:
        story.append(Paragraph(f"Description: {project.description}", styles['Normal']))
        story.append(Spacer(1, 12))
    
    # Project details table
    project_data = [
        ['Project Details', ''],
        ['Location', project.location or 'Not specified'],
        ['Start Date', project.start_date.strftime('%Y-%m-%d') if project.start_date else 'Not specified'],
        ['End Date', project.end_date.strftime('%Y-%m-%d') if project.end_date else 'Ongoing'],
        ['Status', project.status.title()],
        ['Created By', f"{project.created_by.first_name} {project.created_by.last_name}"],
        ['Members', str(len(project.members))],
        ['Report Generated', datetime.now().strftime('%Y-%m-%d %H:%M:%S')]
    ]
    
    project_table = Table(project_data, colWidths=[2*inch, 4*inch])
    project_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('BACKGROUND', (0, 0), (0, 0), colors.darkgrey),
        ('FONTNAME', (0, 0), (0, 0), 'Helvetica-Bold'),
        ('SPAN', (0, 0), (1, 0)),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    story.append(project_table)
    story.append(Spacer(1, 30))
    
    # Get observations data
    observations = Observation.query.filter_by(project_id=project.id).all()
    
    # Summary statistics
    story.append(Paragraph("Summary Statistics", heading_style))
    
    total_observations = len(observations)
    unique_species = len(set(obs.species_id for obs in observations))
    total_individuals = sum(obs.count for obs in observations)
    unique_observers = len(set(obs.observer_id for obs in observations))
    
    summary_data = [
        ['Metric', 'Value'],
        ['Total Observations', str(total_observations)],
        ['Unique Species', str(unique_species)],
        ['Total Individuals Observed', str(total_individuals)],
        ['Number of Observers', str(unique_observers)]
    ]
    
    if observations:
        date_range = f"{min(obs.observation_date for obs in observations).strftime('%Y-%m-%d')} to {max(obs.observation_date for obs in observations).strftime('%Y-%m-%d')}"
        summary_data.append(['Observation Period', date_range])
    
    summary_table = Table(summary_data, colWidths=[3*inch, 2*inch])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    story.append(summary_table)
    story.append(Spacer(1, 30))
    
    # Species breakdown
    if observations:
        story.append(Paragraph("Species Breakdown", heading_style))
        
        species_counts = {}
        for obs in observations:
            species_name = obs.species.common_name
            species_counts[species_name] = species_counts.get(species_name, 0) + obs.count
        
        species_data = [['Species', 'Total Count', 'Observations']]
        for species_name in sorted(species_counts.keys()):
            obs_count = len([obs for obs in observations if obs.species.common_name == species_name])
            species_data.append([species_name, str(species_counts[species_name]), str(obs_count)])
        
        species_table = Table(species_data, colWidths=[3*inch, 1*inch, 1*inch])
        species_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey])
        ]))
        
        story.append(species_table)
        story.append(Spacer(1, 20))
        
        # Generate and include charts
        try:
            chart_image = generate_species_chart(species_counts)
            if chart_image:
                story.append(Paragraph("Species Distribution", heading_style))
                story.append(chart_image)
                story.append(Spacer(1, 20))
        except Exception as e:
            # Skip chart if generation fails
            pass
    
    # Conservation status summary
    if observations:
        story.append(Paragraph("Conservation Status Summary", heading_style))
        
        conservation_counts = {}
        for obs in observations:
            status = obs.species.conservation_status or 'Unknown'
            conservation_counts[status] = conservation_counts.get(status, 0) + 1
        
        conservation_data = [['Conservation Status', 'Number of Species']]
        for status in sorted(conservation_counts.keys()):
            conservation_data.append([status, str(conservation_counts[status])])
        
        conservation_table = Table(conservation_data, colWidths=[3*inch, 2*inch])
        conservation_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(conservation_table)
    
    # Build PDF
    doc.build(story)

def generate_species_chart(species_counts):
    """Generate species distribution chart"""
    try:
        # Create matplotlib figure
        plt.figure(figsize=(10, 6))
        
        # Get top 10 species
        sorted_species = sorted(species_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        species_names = [item[0] for item in sorted_species]
        counts = [item[1] for item in sorted_species]
        
        # Create bar chart
        plt.bar(range(len(species_names)), counts, color='skyblue')
        plt.xlabel('Species')
        plt.ylabel('Total Count')
        plt.title('Top 10 Most Observed Species')
        plt.xticks(range(len(species_names)), species_names, rotation=45, ha='right')
        plt.tight_layout()
        
        # Save to bytes
        img_buffer = io.BytesIO()
        plt.savefig(img_buffer, format='png', dpi=150, bbox_inches='tight')
        img_buffer.seek(0)
        
        # Create ReportLab Image
        chart_image = Image(img_buffer, width=6*inch, height=3.6*inch)
        
        plt.close()  # Clean up
        
        return chart_image
        
    except Exception as e:
        return None